import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// تهيئة العميل بحماية في حالة عدم وجود المفتاح
const groqApiKey = process.env.GROQ_API_KEY;
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();
    
    // محاولة جلب الـ Pharmacy ID من أكثر من مصدر للأمان
    const pharmacyId = context?.pharmacyId || 
                       (req.headers.get('x-pharmacy-id')) || 
                       'eb41535f-e35c-428d-96af-130defca3e1e'; // Fallback for testing

    // جلب بيانات سريعة للسياق
    const startOfDay = new Date().setHours(0,0,0,0);
    const { data: salesData } = await supabase
      .from('orders')
      .select('total')
      .eq('pharmacy_id', pharmacyId)
      .gte('created_at', new Date(startOfDay).toISOString());

    const totalSales = salesData?.reduce((acc: number, o: any) => acc + (o.total || 0), 0) || 0;

    // إذا لم يكن مفتاح Groq متاحاً، نرد برد ذكي محلي (Fallback)
    if (!groq) {
      return NextResponse.json({
        content: `⚠️ **تنبيه للنظام:** مفتاح الذكاء الاصطناعي غير مفعل حالياً.\n\nلكن بناءً على بياناتي المحلية:\n- مبيعات اليوم: **${totalSales} ج.م**\n- أنا جاهز لاستقبال أوامرك بمجرد تفعيل المفتاح!`,
        actions: [{ type: 'inventory', title: 'عرض المخزون' }],
        commands: []
      });
    }

    // نظام الـ Prompt المحترف
    const systemPrompt = `أنت "الدكتور محسن"، مساعد الصيدلية الذكي.
    رد بالعامية المصرية بأسلوب مهني وخفيف.
    بيانات اليوم: المبيعات ${totalSales} ج.م.
    استخدم [ACTION:INVENTORY] إذا سأل عن مخزون، و [ACTION:POS] للصرف.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      model: "llama3-70b-8192",
      temperature: 0.3,
    });

    let aiResponse = chatCompletion.choices[0]?.message?.content || "";
    
    // استخراج الأوامر (Actions)
    const actions: any[] = [];
    const actionRegex = /\[ACTION:(\w+)\]/g;
    let match;
    while ((match = actionRegex.exec(aiResponse)) !== null) {
      actions.push({ type: match[1].toLowerCase(), title: 'فتح الشاشة' });
    }

    // تنظيف الرد
    const cleanContent = aiResponse.replace(/\[ACTION:.*?\]/g, "").trim();

    return NextResponse.json({
      content: cleanContent,
      actions,
      commands: []
    });

  } catch (error: any) {
    console.error('Copilot Error:', error);
    // رد خطأ واضح جداً عشان تعرف المشكلة فين
    return NextResponse.json({
      content: `❌ **خطأ تقني:** ${error.message}\n\nتأكد من مفتاح GROQ_API_KEY في ملف .env`,
      actions: [],
      commands: []
    }, { status: 200 }); // بنرجع 200 عشان الـ UI يعرض رسالة الخطأ كـ Chat Message
  }
}