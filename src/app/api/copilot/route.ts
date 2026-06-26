import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama3-70b-8192";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, chatHistory, context } = await req.json();
    const pharmacyId = context?.pharmacyId;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized: Pharmacy ID is missing" }, { status: 401 });
    }

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }


    const todayStr = new Date().toLocaleDateString('en-CA'); 

    const [salesResponse, shortagesResponse, debtorsResponse] = await Promise.all([
      supabase.from('orders').select('total').eq('pharmacy_id', pharmacyId).gte('created_at', todayStr),
      supabase.from('product_inventory').select('id').eq('pharmacy_id', pharmacyId).lt('total_quantity', 10).limit(10),
      supabase.from('customers').select('id, name, total_debt').eq('pharmacy_id', pharmacyId).order('total_debt', { ascending: false }).limit(5)
    ]);

    if (salesResponse.error) console.error("Sales fetch error:", salesResponse.error.message);
    if (shortagesResponse.error) console.error("Inventory fetch error:", shortagesResponse.error.message);

    const salesToday = salesResponse.data || [];
    const shortages = shortagesResponse.data || [];
    const topDebtors = debtorsResponse.data || [];

    const totalSales = salesToday.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;

    const systemInstruction = `أنت "الدكتور محسن"، الصيدلي الذكي وعقل نظام PharmaNile لإدارة الصيدليات.
حضرتك مش مجرد بوت محادثة، أنت صيدلي استشاري خبير وجدع، بتدير الصيدلية بذكاء عالي وتدعم فريق العمل.

كتالوج واجهات النظام والأوامر المتاحة لك للتفاعل مع الشاشة:
1. [ACTION:POS] - لفتح (شاشة نقطة البيع وصرف الأدوية)
2. [ACTION:INVENTORY] - لفتح (شاشة المخزن، النواقص، وإدارة الأصناف)
3. [ACTION:FINANCIALS] - لفتح (شاشة تقارير الأرباح، الخزنة، والمبيعات)
4. [ACTION:CUSTOMER_SUMMARY] - لفتح (شاشة حسابات العملاء والديون والائتمان)
5. [ACTION:STAFF] - لفتح (شاشة إدارة الموظفين والورديات)

الأوامر البرمجية للتنفيذ المباشر (Execution):
- لإضافة صنف مباشرة إلى سلة بيع الكاشير النشطة، استخدم الصياغة التالية: [EXECUTE:ADD_TO_CART:{"name":"اسم الدواء"}]

مهمتك وحقيبتك المهنية:
- حلل طلب المستخدم بعقلك الصيدلي التقني وبناءً على البيانات اللحظية الموفرة لك.
- إذا كانت المشكلة مركبة، يمكنك دمج أكثر من أكشن في ردك (مثال: فتح المخزن والمالية معاً).
- رد دائماً بالعامية المصرية بأسلوب صيدلي شاطر، خفيف الظل، ومحترف.
- استأذن المستخدم دائماً قبل كتابة أمر التنفيذ المباشر [EXECUTE] إذا كان الأمر يتعلق بعملية حساسة.

بيانات الصيدلية اللحظية لحالتك الآن:
- إجمالي مبيعات اليوم: ${totalSales} جنيه مصري.
- عدد فواتير اليوم: ${salesToday.length} فاتورة.
- الأصناف القريبة من النفاذ (النواقص الحالية): ${shortages.length} أصناف.
- قائمة أعلى المدينين كودياً: ${JSON.stringify(topDebtors)}
`;

    const formattedMessages = [
      { role: "system" as const, content: systemInstruction },
      ...(chatHistory || [])
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
      temperature: 0.2, // درجة منخفضة لضمان الالتزام المطلق بالأكواد وعدم ابتكار تاجات وهمية
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "";

    const actions: any[] = [];
    const commands: any[] = [];

    const actionMap: { [key: string]: string } = {
      'POS': 'نقطة البيع',
      'INVENTORY': 'المخزن والأصناف',
      'FINANCIALS': 'التقارير المالية',
      'CUSTOMER_SUMMARY': 'ديون العملاء',
      'STAFF': 'إدارة الموظفين'
    };

    const actionRegex = /\[ACTION:(\w+)\]/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(aiResponse)) !== null) {
      const typeKey = actionMatch[1];
      if (actionMap[typeKey]) {
        actions.push({
          type: typeKey.toLowerCase(),
          title: actionMap[typeKey]
        });
      }
    }

    const executeRegex = /\[EXECUTE:(\w+):(\{[\s\S]*?\})\]/g;
    let executeMatch;
    while ((executeMatch = executeRegex.exec(aiResponse)) !== null) {
      try {
        commands.push({
          type: executeMatch[1],
          payload: JSON.parse(executeMatch[2].trim())
        });
      } catch (e) {
        console.error("Failed to parse دكتور محسن execute JSON command:", e);
      }
    }

    const cleanContent = aiResponse
      .replace(/\[ACTION:.*?\]/g, "")
      .replace(/\[EXECUTE:.*?\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    return NextResponse.json({
      content: cleanContent || "تمام يا فندم، متاح معاك لمتابعة الصيدلية.",
      actions,
      commands
    });

  } catch (error: any) {
    console.error('Groq Real-time Agent Error:', error);
    return NextResponse.json(
      { error: 'Agent Execution Failed: ' + error.message },
      { status: 500 }
    );
  }
}
