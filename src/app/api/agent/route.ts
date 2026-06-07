import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// تهيئة مكتبة Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// موديل Llama 3 المدعوم والقوي جداً في تنفيذ المهام البرمجية وفهم السياق العربي
const GROQ_MODEL = "llama3-70b-8192";

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

    // 1. جلب سياق العمليات الأخيرة لتعزيز وعي العميل الذكي
    const { data: recentLogs } = await supabase
      .from('agent_action_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const systemPrompt = `أنت "المساعد الذكي" وعقل نظام PharmaNile، الملقب بـ "دكتور محسن".
أنت صيدلي خبير تقني تدير الصيدلية بذكاء.

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

سجل العمليات الأخيرة في النظام للوعي: ${JSON.stringify(recentLogs || [])}
`;

    // 2. إعداد الرسائل وتجهيز الـ History متوافق مع Groq Chat Completion
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

    // 3. الاتصال بـ Groq عبر الـ SDK الرسمي
    const chatCompletion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: GROQ_MODEL,
      temperature: 0.2, // لضمان ثبات الأكواد البرمجية المستخرجة
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";

    // 4. تحليل الأوامر المستخرجة من رد النموذج (Actions Parsing)
    let action: any = null;
    
    // تحسين الـ Regex لـ [OPEN_IFRAME:/url:Title] ليدعم الحروف العربية والمسافات بشكل مستقر
    const iframeMatch = aiResponse.match(/\[OPEN_IFRAME:([^:]+):([^\]]+)\]/);
    if (iframeMatch) {
      action = {
        type: 'OPEN_IFRAME',
        url: iframeMatch[1].trim(),
        title: iframeMatch[2].trim()
      };
    }

    // تحسين الـ Regex لـ [ASK_PERMISSION:Message:Table:Action:Payload] ليدعم الكائنات المعقدة والنصوص العربية والأسطر
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

    // 5. تطهير وتنظيف نص الرد الموجه للمستخدم النهائي تماماً من هذه الأكواد الهيكلية
    const cleanContent = aiResponse
      .replace(/\[OPEN_IFRAME:.*?\]/g, "")
      .replace(/\[ASK_PERMISSION:.*?\]/g, "")
      .replace(/\s+/g, " ") // تنظيف المسافات الزائدة الناتجة عن الحذف
      .trim();

    // 6. العودة بالرد النهائي النظيف والـ action المطلوب إن وجد
    return NextResponse.json({ 
      reply: cleanContent || "تمام يا فندم، أنا معاك وجاهز لأي أمر.", 
      action 
    });

  } catch (error: any) {
    console.error('Groq Agent API Route Error:', error);
    return NextResponse.json({ error: 'Internal Agent Error: ' + error.message }, { status: 500 });
  }
}