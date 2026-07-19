import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { getCache, setCache } from '@/lib/redis';

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
    const { message, context, chatHistory } = await req.json();
    const pharmacyId = context?.pharmacyId;

    if (!pharmacyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const salesCacheKey = `cache:pharmacy-sales:${pharmacyId}`;
    let totalSales = await getCache<number>(salesCacheKey);

    if (totalSales === null) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const { data: salesData } = await supabase
        .from('orders')
        .select('total')
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', startOfDay.toISOString());

      totalSales = salesData?.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;
      await setCache(salesCacheKey, totalSales, 30); // cache for 30s
    }

    const systemPrompt = `أنت "الدكتور محسن"، مساعد الصيدلية الذكي في نظام PharmaNile.
    رد دائماً بالعامية المصرية بأسلوب مهني، خفيف الظل، وجدع.
    بيانات اليوم: إجمالي المبيعات ${totalSales} ج.م.

    هدفك مساعدة الصيدلي في أداء مهامه بسرعة عبر فتح الشاشات المناسبة له.
    إذا طلب المستخدم أداء أي من المهام التالية، قم بالرد بشكل مناسب واستخدم الكود البرمجي الخاص بالشاشة في نهاية رسالتك لكي يقوم النظام بفتحها:
    - لفتح نقطة البيع أو الكاشير أو الصرف: استخدم [ACTION:POS]
    - لعمل جرد المخزون، أو عرض الأصناف الناقصة، أو الأدوية التي قاربت على الانتهاء: استخدم [ACTION:INVENTORY]
    - لفتح المبيعات، ومخططات وتحليلات المبيعات: استخدم [ACTION:SALES_CHART]
    - لفتح حسابات العملاء، أو العملاء المتأخرين، أو الديون: استخدم [ACTION:CUSTOMERS]
    - لفتح التقارير المالية والماليات: استخدم [ACTION:FINANCIALS]

    يمكنك استخدام أكثر من أمر إذا دعت الحاجة.
    تذكر أن تطمئن الطبيب أنك ستقوم باللازم.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...(chatHistory || []).map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: "user", content: message }
      ],
      model: GROQ_MODEL, 
      temperature: 0.3,
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    
    // Parse actions dynamically based on known tabs
    const actions: { type: string; title: string }[] = [];
    const actionRegex = /\[ACTION:([A-Z_]+)\]/g;
    let match;
    while ((match = actionRegex.exec(aiResponse)) !== null) {
      const actionType = match[1].toLowerCase();
      let title = "فتح الشاشة";
      if (actionType === "pos") title = "نقطة البيع";
      if (actionType === "inventory") title = "المخزون والجرد";
      if (actionType === "sales_chart") title = "تحليلات المبيعات";
      if (actionType === "customers") title = "إدارة العملاء";
      if (actionType === "financials") title = "التقارير المالية";
      
      // Prevent duplicates
      if (!actions.some(a => a.type === actionType)) {
        actions.push({ type: actionType, title });
      }
    }

    // Clean actions from response text so they aren't visible
    const cleanContent = aiResponse.replace(/\[ACTION:[A-Z_]+\]/g, "").trim();

    return NextResponse.json({
      content: cleanContent,
      actions,
      commands: []
    });

  } catch (error: any) {
    console.error('Copilot Error:', error);
    return NextResponse.json({
      content: `❌ **خطأ تقني:** ${error.message}`,
      actions: [],
      commands: []
    }, { status: 200 });
  }
}