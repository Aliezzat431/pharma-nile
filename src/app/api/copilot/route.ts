import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import { getCache, setCache } from '@/lib/redis';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = 'llama-3.3-70b-versatile';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, context, chatHistory } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // --- Auth: resolve pharmacyId server-side from the user's session ---
    let pharmacyId: string | null = context?.pharmacyId ?? null;

    // If the client didn't send pharmacyId, try using the Authorization header
    if (!pharmacyId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: accessData } = await supabase
            .from('user_pharmacy_access')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .maybeSingle();
          pharmacyId = accessData?.pharmacy_id ?? null;
        }
      }
    }

    // Build context string from pharmacy data
    let contextualData = '';
    if (pharmacyId) {
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

        totalSales = salesData?.reduce((acc: number, o: any) => acc + (o.total || 0), 0) ?? 0;
        await setCache(salesCacheKey, totalSales, 30);
      }

      contextualData = `\nبيانات اليوم: إجمالي مبيعات الصيدلية اليوم = ${totalSales.toLocaleString('ar-EG')} ج.م.`;
    }

    const systemPrompt = `أنت "الدكتور محسن"، المساعد الذكي لإدارة الصيدلية في نظام PharmaNile.
رد دائماً بالعامية المصرية بأسلوب مهني، خفيف الظل، وجدع. استخدم الإيموجي بشكل طبيعي.
${contextualData}

هدفك الأساسي مساعدة الصيدلي بسرعة وكفاءة. عند طلب أي مهمة من المهام التالية، أضف الكود البرمجي الخاص بها في نهاية ردك:

المهام المتاحة:
- فتح نقطة البيع أو الكاشير أو صرف أدوية: [ACTION:POS]
- جرد المخزون، الأصناف الناقصة، الأدوية التي قاربت الانتهاء: [ACTION:INVENTORY]
- تحليلات المبيعات ومخططاتها: [ACTION:SALES_CHART]
- حسابات العملاء، المتأخرات، الديون: [ACTION:CUSTOMERS]
- التقارير المالية والميزانية العامة: [ACTION:FINANCIALS]

قواعد مهمة:
- يمكنك إضافة أكثر من كود في رد واحد إذا احتاج المستخدم أكثر من شاشة.
- لا تخترع أرقاماً أو بيانات غير موجودة. إذا لم تعرف، قل ذلك بصراحة.
- الردود تكون مختصرة وعملية قدر الإمكان.
- اهتم بالتفاصيل: واجب تطمن الدكتور إن إيه اللي هيتعمل.`;

    const formattedHistory = (chatHistory || [])
      .filter((m: any) => m?.content && m.role !== 'welcome')
      .slice(-12)
      .map((m: any) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: message },
      ],
      model: GROQ_MODEL,
      temperature: 0.35,
      max_tokens: 1024,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content ?? '';

    // Parse action tokens
    const actions: { type: string; title: string }[] = [];
    const actionRegex = /\[ACTION:([A-Z_]+)\]/g;
    let match;
    while ((match = actionRegex.exec(aiResponse)) !== null) {
      const actionType = match[1].toLowerCase();
      const titleMap: Record<string, string> = {
        pos: 'نقطة البيع',
        inventory: 'المخزون والجرد',
        sales_chart: 'تحليلات المبيعات',
        customers: 'إدارة العملاء',
        financials: 'التقارير المالية',
      };
      if (!actions.some(a => a.type === actionType)) {
        actions.push({ type: actionType, title: titleMap[actionType] ?? 'فتح الشاشة' });
      }
    }

    // Strip all action tokens from the visible reply
    const cleanContent = aiResponse.replace(/\[ACTION:[A-Z_]+\]/g, '').replace(/\s{2,}/g, ' ').trim();

    return NextResponse.json({ content: cleanContent, actions, commands: [] });
  } catch (error: any) {
    console.error('Copilot Error:', error);
    return NextResponse.json(
      {
        content: '⚠️ عذراً، حدث خطأ تقني. حاول مرة تانية.',
        actions: [],
        commands: [],
      },
      { status: 200 }
    );
  }
}