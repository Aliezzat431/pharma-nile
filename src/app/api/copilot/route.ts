import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Using Official Mistral AI API (Direct, no gateways)
const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = "mistral-small-latest"; // The flagship 22B OSS model

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, chatHistory } = await req.json();

    // 1. GATHER REAL-TIME PHARMACY DATA
    const [
      { data: salesToday },
      { data: shortages },
      { data: topDebtors }
    ] = await Promise.all([
      supabase.from('orders').select('total').gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('product_inventory').select('*').lt('total_quantity', 10).limit(10),
      supabase.from('customers').select('*').order('total_debt', { ascending: false }).limit(5)
    ]);

    const totalSales = salesToday?.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;

    const systemInstruction = `
أنت "الدكتور محسن"، الصيدلي الأيجنت وعقل نظام PharmaNile. 
حضرتك مش مجرد بوت، أنت صيدلي خبير بتدير الصيدلية بذكاء.

كتالوج قدرات النظام المتاحة لك:
1. [ACTION:POS] - (بيع وصرف الأدوية): استخدمه في كل ما يخص حركات البيع، الفواتير، أو التعامل اللحظي مع الزبائن.
2. [ACTION:INVENTORY] - (المخزن والطلبيات): استخدمه لإدارة الأصناف، النواقص، تاريخ الصلاحية، أو إضافة أدوية جديدة.
3. [ACTION:FINANCIALS] - (الخزنة والأرباح): لمتابعة المكاسب، المصاريف، وأداء الصيدلية المالي.
4. [ACTION:CUSTOMER_SUMMARY] - (الديون والائتمان): لمتابعة حسابات العملاء المديونين.
5. [ACTION:STAFF] - (فريق العمل): لمتابعة الورديات والموظفين.
6. [EXECUTE:ADD_TO_CART:{"name":"..."}] - (تفاعل مباشر): لإضافة دواء لسلة البيع النشطة.

مهمتك:
- حلل طلب المستخدم بعقلك الصيدلي.
- لو المشكلة مركبة، افتح أكتر من شاشة (مثلاً المالية والمخزن).
- استأذن المستخدم قبل ما "تنفذ" أي عملية برمجية (EXECUTE).
- كن استشارياً: لو سألك عن "حال الصيدلية"، افتح شاشات التحليلات فوراً واديله "الزتونة".

بياناتك الحالية: مبيعات ${totalSales} - نواقص ${shortages?.length} - فواتير ${salesToday?.length}.
`;

    // 2. CONNECT TO OFFICIAL MISTRAL AI API
    const response = await fetch(MISTRAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: "system", content: systemInstruction },
          ...(chatHistory || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: "user", content: message }
        ],
        temperature: 0.2, // Lower temperature for strict command following
      })
    });

    if (!response.ok) throw new Error("AI Endpoint Error");

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "";

    // 3. PARSE ACTIONS & COMMANDS
    const actions: any[] = [];
    const commands: any[] = [];

    if (aiResponse.includes("[ACTION:POS]")) actions.push({ type: 'pos', title: 'نقطة البيع' });
    if (aiResponse.includes("[ACTION:INVENTORY]")) actions.push({ type: 'inventory', title: 'المخزن' });
    if (aiResponse.includes("[ACTION:FINANCIALS]")) actions.push({ type: 'financials', title: 'التقارير' });

    // Parse [EXECUTE:TYPE:JSON]
    const executeRegex = /\[EXECUTE:(\w+):({.*?})\]/g;
    let match;
    while ((match = executeRegex.exec(aiResponse)) !== null) {
      try {
        commands.push({ type: match[1], payload: JSON.parse(match[2]) });
      } catch (e) { console.error("Command Parse Error", e); }
    }

    const cleanContent = aiResponse.replace(/\[ACTION:.*?\]/g, "").replace(/\[EXECUTE:.*?\]/g, "").trim();

    return NextResponse.json({ content: cleanContent, actions, commands });

  } catch (error: any) {
    console.error('GPT-OSS Error:', error);
    return NextResponse.json({ error: 'GPT-OSS Connection Failed: ' + error.message }, { status: 500 });
  }
}