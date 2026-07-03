import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama-3.3-70b-versatile"; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // ── 1. Secure Authentication & Authorization ────────────────────────────
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Authentication required" }, { status: 401 });
    }

    // ── 2. Derive Tenant Context securely from DB ───────────────────────────
    const { data: accessData } = await supabase
      .from('user_pharmacy_access')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .maybeSingle();

    const pharmacyId = accessData?.pharmacy_id;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized: No primary pharmacy context found" }, { status: 401 });
    }

    // ── 3. Fetch Pharmacy Scope Logs only ────────────────────────────────────
    const { data: recentLogs } = await supabase
      .from('agent_action_logs')
      .select('*')
      .eq('pharmacy_id', pharmacyId) // 🔒 Enforce tenant isolation
      .order('created_at', { ascending: false })
      .limit(3);

    const systemPrompt = `أنت "المساعد الذكي" وعقل نظام PharmaNile، الملقب بـ "دكتور محسن".
أنت صيدلي خبير تقني تدير الصيدلية بذكاء.

بيانات صيدليتك الحالية: pharmacy_id = "${pharmacyId}"

قدراتك التقنية لفتح واجهات العمل (Workspaces):
- لفتح أي صفحة للمستخدم، استخدم التنسيق الصارم التالي: [OPEN_IFRAME:URL:TITLE]
- الروابط المتاحة في النظام فقط:
  - /pos (نقطة البيع)
  - /invoices (الفواتير والمرتجعات)
  - /inventory (المخزن والأصناف)
  - /products (الأسعار والبيانات)
  - /orders (لوحة تحليلات المبيعات)

قدراتك في تنفيذ العمليات (Undo System):
- إذا طلب المستخدم تعديل حساس (تغيير سعر، حذف فاتورة، تعديل مخزون كبير)، يجب عليك طلب الإذن أولاً بالتنسيق الصارم التالي:
  [ASK_PERMISSION:MESSAGE:TABLE:ACTION:PAYLOAD_JSON]
- تأكد أن كائن PAYLOAD_JSON هو عبارة عن كائن JSON صالح سليم البنية وبدون أسطر جديدة بداخله.
- إذا كان التعديل بسيطاً وغير حساس، نفذه مباشرة (في عقلك وأخبر المستخدم، أو اطلب منه تأكيد بسيط).

قواعد هامة جداً:
1. رد دائماً بالعامية المصرية بأسلوب صيدلي شاطر، خفيف الظل، وجدع.
2. إذا طلب المستخدم حل مشكلة، ابحث عن الصفحة المناسبة وافتحها له فوراً باستخدام [OPEN_IFRAME].
3. التزم تماماً بالتنسيقات البرمجية المذكورة أعلاه ليتمكن النظام من فهمها وتمريرها للمتصفح.

سجل العمليات الأخيرة في صيدليتك للوعي: ${JSON.stringify(recentLogs || [])}
`;

    const formattedMessages = [
      { role: "system" as const, content: systemPrompt },
      ...(history || [])
        .filter((msg: any) => msg && msg.content)
        .map((msg: any) => ({
          role: (msg.role === 'assistant' ? 'assistant' : 'user') as "assistant" | "user",
          content: msg.content
        })),
      { role: "user" as const, content: message }
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: GROQ_MODEL,
      temperature: 0.2, // لضمان ثبات الأكواد البرمجية المستخرجة
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";

    let action: any = null;

    const iframeMatch = aiResponse.match(/\[OPEN_IFRAME:([^:]+):([^\]]+)\]/);
    if (iframeMatch) {
      action = {
        type: 'OPEN_IFRAME',
        url: iframeMatch[1].trim(),
        title: iframeMatch[2].trim()
      };
    }

    const permissionMatch = aiResponse.match(/\[ASK_PERMISSION:(.*?):(.*?):(.*?):(\{[\s\S]*?\})\]/);
    if (permissionMatch) {
      try {
        action = {
          type: 'ASK_PERMISSION',
          message: permissionMatch[1].trim(),
          actionType: permissionMatch[3].trim(),
          payload: {
            table: permissionMatch[2].trim(),
            data: JSON.parse(permissionMatch[4].trim())
          }
        };
      } catch (jsonErr) {
        console.error("Failed to parse Agent generated JSON payload:", jsonErr);
      }
    }

    const cleanContent = aiResponse
      .replace(/\[OPEN_IFRAME:.*?\]/g, "")
      .replace(/\[ASK_PERMISSION:.*?\]/g, "")
      .replace(/\s+/g, " ") // تنظيف المسافات الزائدة الناتجة عن الحذف
      .trim();

    return NextResponse.json({ 
      reply: cleanContent || "تمام يا فندم، أنا معاك وجاهز لأي أمر.", 
      action 
    });

  } catch (error: any) {
    console.error('Groq Agent API Route Error:', error);
    return NextResponse.json({ error: 'Internal Agent Error: ' + error.message }, { status: 500 });
  }
}
