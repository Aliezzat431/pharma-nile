import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Using Official Mistral AI API (Direct, no gateways)
const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = "mistral-small-latest";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // 1. GATHER CONTEXT (Optional but better for agent awareness)
    const { data: recentLogs } = await supabase
      .from('agent_action_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    const systemPrompt = `أنت "المساعد الذكي" وعقل نظام PharmaNile، الملقب بـ "دكتور محسن".
أنت صيدلي خبير تقني تدير الصيدلية بذكاء.

قدراتك التقنية لفتح واجهات العمل (Workspaces):
- لفتح أي صفحة للمستخدم، استخدم التنسيق: [OPEN_IFRAME:URL:TITLE]
- الروابط المتاحة:
  - /pos (نقطة البيع)
  - /invoices (الفواتير والمرتجعات)
  - /inventory (المخزن والأصناف)
  - /products (الأسعار والبيانات)
  - /orders (لوحة تحليلات المبيعات)

قدراتك في تنفيذ العمليات (Undo System):
- إذا طلب المستخدم تعديل حساس (تغيير سعر، حذف فاتورة، تعديل مخزون كبير)، يجب عليك طلب الإذن أولاً بالتنسيق: [ASK_PERMISSION:MESSAGE:TABLE:ACTION:PAYLOAD_JSON]
- إذا كان التعديل بسيطاً وغير حساس، نفذه مباشرة (في عقلك وأخبر المستخدم، أو اطلب منه تأكيد بسيط).

قواعد هامة:
1. رد دائماً بالعامية المصرية بأسلوب صيدلي شاطر.
2. إذا طلب المستخدم حل مشكلة، ابحث عن الصفحة المناسبة وافتحها له فوراً باستخدام [OPEN_IFRAME]. يمكن فتح أكثر من صفحة لو تطلب الأمر.
3. التزم تماماً بالتنسيقات البرمجية المذكورة أعلاه ليتمكن النظام من فهمها.

سجل العمليات الأخيرة: ${JSON.stringify(recentLogs)}
`;

    // 2. CONNECT TO MISTRAL AI API
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...(history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        temperature: 0.3,
      })
    });

    if (!response.ok) throw new Error("AI Endpoint Error");

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    // 3. PARSE ACTIONS
    let action = null;
    
    // Parse [OPEN_IFRAME:/url:Title]
    const iframeMatch = aiResponse.match(/\[OPEN_IFRAME:([\/\w]+):([^\]]+)\]/);
    if (iframeMatch) {
      action = {
        type: 'OPEN_IFRAME',
        url: iframeMatch[1],
        title: iframeMatch[2]
      };
    }

    // Parse [ASK_PERMISSION:Message:Table:Action:Payload]
    const permissionMatch = aiResponse.match(/\[ASK_PERMISSION:([^:]+):([^:]+):([^:]+):({.+})\]/);
    if (permissionMatch) {
      action = {
        type: 'ASK_PERMISSION',
        message: permissionMatch[1],
        actionType: permissionMatch[3],
        payload: {
          table: permissionMatch[2],
          data: JSON.parse(permissionMatch[4])
        }
      };
    }

    // Clean response text from blocks
    const cleanContent = aiResponse
      .replace(/\[OPEN_IFRAME:.*?\]/g, "")
      .replace(/\[ASK_PERMISSION:.*?\]/g, "")
      .trim();

    return NextResponse.json({ 
      reply: cleanContent, 
      action 
    });

  } catch (error: any) {
    console.error('Agent API Error:', error);
    return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 500 });
  }
}
