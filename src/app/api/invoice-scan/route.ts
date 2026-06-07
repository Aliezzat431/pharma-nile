import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface ExtractedInvoiceItem {
  product_name: string;
  quantity: number;
  public_price: number;
  purchase_price: number;
  expiry_date: string;
  barcode?: string;
  is_new?: boolean;
}

export async function POST(req: Request) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is missing in environment variables' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('invoice') as File | null;
    if (!file) return NextResponse.json({ error: 'لم يتم رفع صورة الفاتورة.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // استخدام موديل الرؤية القوي والمستقر للـ OCR
    const visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';

    // تم تعديل الهيكل المطلوب ليكون كائن JSON يحتوي على مصفوفة لتفعيل خاصية الـ json_object الإجبارية
    const prompt = `You are an expert pharmaceutical invoice OCR extractor system.
Analyze this Arabic medical invoice image and extract all medicine items from the rows.

Focus strictly on these columns:
1. 'اسم الصنف' -> product_name (You MUST translate the medicine name to its standard English trade name, e.g., 'بارامول' to 'Paramol', 'أوجمنتين' to 'Augmentin')
2. 'الكمية المنصرفة' -> quantity (Integer number)
3. 'سعر الوحدة' -> public_price (Decimal/Number in EGP)

Rules:
- Ignore background watermarks or handwritten margins like 'Page 3'.
- If expiry date is written, extract it in YYYY-MM-DD format. If not found, omit it.
- Your output MUST be a strict, valid JSON object containing an array field named "items". Do not write any markdown fences or thoughts.

Target JSON Layout Structure:
{
  "items": [
    {
      "product_name": "Standardized English Name",
      "quantity": 5,
      "public_price": 45.50,
      "purchase_price": 0.0,
      "expiry_date": "2027-12-31",
      "barcode": ""
    }
  ]
}`;

    // 1. الاتصال بـ Groq Vision API مع تفعيل الـ JSON Mode الإجباري
    const completion = await groq.chat.completions.create({
      model: visionModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      temperature: 0.1, // درجة حرارة منخفضة جداً لمنع الـ Hallucinations وضمان دقة الأرقام
      max_tokens: 2048,
      response_format: { type: "json_object" } // إجبار الموديل على إرجاع كائن نقي بنسبة 100%
    });

    const rawText = completion.choices[0]?.message?.content || '{}';

    // 2. تحليل النص المستخرج بأمان
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch (parseErr) {
      // الـ Fallback الذكي الذي قمت ببنائه يدوياً للتأمين الإضافي في حال حدوث أي خطأ هيكلي
      console.warn('Direct JSON parse failed, trying depth extraction fallback...');
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          parsedData = JSON.parse(rawText.slice(start, end + 1));
        } catch {
          throw new Error('فشل الـ AI في إعداد بنية كود JSON صالحة للفاتورة.');
        }
      } else {
        throw new Error('لم يتم العثور على كائن بيانات صالح داخل رد الـ AI.');
      }
    }

    const rawItems = parsedData.items || parsedData.choices || [];
    if (!Array.isArray(rawItems)) {
      throw new Error('مخرجات الـ AI لا تحتوي على مصفوفة أصناف صالحة.');
    }

    // حساب تاريخ افتراضي مرن (بعد سنتين من التاريخ الحالي) لو كانت الفاتورة بدون تاريخ صلاحية واضح
    const fallbackExpiry = new Date();
    fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 2);
    const fallbackExpiryStr = fallbackExpiry.toLocaleDateString('en-CA');

    // 3. تطهير وفلترة البيانات الناتجة لمنع مدخلات الـ Null أو الـ NaN
    const processedItems: ExtractedInvoiceItem[] = rawItems.map((item: any) => ({
      product_name:   String(item.product_name || 'Unknown Item').trim(),
      quantity:       Math.max(1, Math.round(Number(item.quantity) || 1)),
      public_price:   Math.max(0, Number(item.public_price ?? item.price) || 0),
      purchase_price: Math.max(0, Number(item.purchase_price) || 0),
      expiry_date:    item.expiry_date && item.expiry_date !== '' ? String(item.expiry_date) : fallbackExpiryStr,
      barcode:        item.barcode ? String(item.barcode).trim() : '',
      is_new:         true,
    }));

    // 4. العودة بالبيانات النهائية الجاهزة للعرض في جدول المراجعة قبل الحفظ
    return NextResponse.json({ 
      success: true,
      items: processedItems, 
      total: processedItems.length 
    });

  } catch (error: any) {
    console.error('OCR Processing Pipeline Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to analyze invoice image' }, { status: 500 });
  }
}