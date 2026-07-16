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
    const { message, context } = await req.json();
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

    const systemPrompt = `أنت "الدكتور محسن"، مساعد الصيدلية الذكي.
    رد بالعامية المصرية بأسلوب مهني وخفيف.
    بيانات اليوم: المبيعات ${totalSales} ج.م.
    استخدم [ACTION:INVENTORY] إذا سأل عن مخزون، و [ACTION:POS] للصرف.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: GROQ_MODEL, 
      temperature: 0.3,
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    
    
    const actions: any[] = [];
    const actionRegex = /\[ACTION:(\w+)\]/g;
    let match;
    while ((match = actionRegex.exec(aiResponse)) !== null) {
      actions.push({ type: match[1].toLowerCase(), title: 'فتح الشاشة' });
    }

    
    const cleanContent = aiResponse.replace(/\[ACTION:.*?\]/g, "").trim();

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