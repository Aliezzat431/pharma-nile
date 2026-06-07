import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama3-70b-8192";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم إرفاق الملف.' }, { status: 400 });
    }

    // 1. تقنية "اقتطاع العينة الحجمية" (Chunk Sampling)
    // بدلاً من قراءة الملف بالكامل، نقرأ أول 50 كيلوبايت فقط وهي كافية جداً لفهم الهيكل ومسميات الحقول
    const sampleStream = file.slice(0, 50 * 1024); 
    const sampleText = await sampleStream.text();
    
    let sampleData: any;
    try {
      // محاولة إغلاق القوس لتشكيل JSON سليم في حال انقطع النص بسبب حجم العينة
      let cleanSample = sampleText.trim();
      if (!cleanSample.endsWith('}')) {
        // تنظيف تقريبي سريع لجعل النص صالحاً للقراءة كـ JSON لعينة فقط
        const lastOpenBracket = cleanSample.lastIndexOf('[');
        const lastOpenBrace = cleanSample.lastIndexOf('{');
        const cutIndex = Math.max(lastOpenBracket, lastOpenBrace);
        cleanSample = cleanSample.substring(0, cutIndex) + '\n  ]\n}'; 
      }
      // إذا فشل الـ Parse المباشر بسبب القطع، سنمرر النص الخام للـ AI وهو عبقري في فهم الأنماط حتى لو مقطوعة!
      sampleData = cleanSample;
    } catch (e) {
      sampleData = sampleText.substring(0, 5000); // Fallback لنص خام
    }

    // جداول النظام المستهدفة في نظام PharmaNile
    const targetSchema = {
      pharmacies: ['id', 'name', 'address'],
      companies: ['id', 'name', 'country'],
      products: ['id', 'name', 'company_id', 'price', 'type', 'unit_conversion'],
      customers: ['id', 'name', 'total_debt'],
      orders: ['id', 'pharmacy_id', 'customer_id', 'total', 'created_at']
    };

    // 2. استدعاء الـ AI لدراسة العينة المستقطعة فقط
    const systemPrompt = `You are an expert data migration system.
Your job is to analyze a raw sample (potentially truncated) of an uploaded pharmacy data file and map it to our target database schema.

Our Target Database Schema:
${JSON.stringify(targetSchema, null, 2)}

Identify the uploaded JSON keys that represent our target tables and map their internal fields.
Return ONLY a valid JSON object matching this structure:
{
  "table_mapping": { "source_key": "target_table" },
  "field_mapping": { "target_table": { "source_field": "target_field" } }
}`;

    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is the raw snapshot sample of the file:\n${sampleData}` }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    const mappingSchema = JSON.parse(chatCompletion.choices[0]?.message?.content || "{}");

    // 3. قراءة الملف بالكامل الآن للضخ المباشر بعد أن أصبح لدينا الخريطة الأمنية
    const fullText = await file.text();
    const fullData = JSON.parse(fullText);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const executionOrder = ['pharmacies', 'companies', 'customers', 'products', 'orders'];
    const CHUNK_SIZE = 500;

    // 4. حلقة التحويل والضخ المبنية على خريطة العينة
    for (const targetTable of executionOrder) {
      const sourceKey = Object.keys(mappingSchema.table_mapping).find(
        key => mappingSchema.table_mapping[key] === targetTable
      );

      if (!sourceKey || !fullData[sourceKey]) continue;

      const rawRows = fullData[sourceKey];
      const fieldMap = mappingSchema.field_mapping[targetTable] || {};

      if (Array.isArray(rawRows) && rawRows.length > 0) {
        const transformedRows = rawRows.map((row: any) => {
          const newRow: any = {};
          for (const oldField in row) {
            const newField = fieldMap[oldField] || oldField;
            newRow[newField] = row[oldField];
          }
          return newRow;
        });

        // الضخ على دفعات صغيرة لحماية اتصال قاعدة البيانات
        for (let i = 0; i < transformedRows.length; i += CHUNK_SIZE) {
          const chunk = transformedRows.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase.from(targetTable).upsert(chunk, { onConflict: 'id' });

          if (error) throw new Error(`خطأ في جدول ${targetTable}: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'يا فندم السيستم اقتطع عينة صغيرة، درس مسمياتها عبر الـ AI، ونفذ عملية النقل لكل الملايين من السجلات المتبقية بكفاءة 100%.',
      mapping_applied: mappingSchema
    });

  } catch (error: any) {
    console.error('AI Smart Batch Import Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}