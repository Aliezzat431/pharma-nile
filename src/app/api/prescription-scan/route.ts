import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface ExtractedPrescriptionItem {
  medicine_name: string;        // الاسم الأصلي كما في الروشتة
  medicine_name_en?: string;    // الاسم الإنجليزي إن وُجد
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  confidence: number;           // 0-1 مستوى الثقة
  raw_text?: string;            // النص الخام المقروء
}

export async function POST(req: Request) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is missing' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('prescription') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم إرفاق صورة الروشتة.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const groq = new Groq({ apiKey: GROQ_API_KEY });


const visionModel = 'llama-3.2-90b-vision-preview';

    const prompt = `You are "Dr. Mohsen", an expert Egyptian pharmacist with 20 years of experience reading handwritten Arabic medical prescriptions.

Your task: Read this prescription image CAREFULLY and extract medications with MAXIMUM ACCURACY.

## CRITICAL RULES:

1. **READ FIRST, TRANSLITERATE SECOND**: 
   - First, read the EXACT text as written (Arabic or English)
   - Keep the original text in "medicine_name" field
   - If you can confidently identify the English brand name, put it in "medicine_name_en"
   - If unsure about English name, LEAVE "medicine_name_en" EMPTY - DO NOT GUESS

2. **ARABIC PRESCRIPTION READING TIPS**:
   - Doctors often write abbreviations: حبوب = tablets, شراب = syrup, حقن = injection
   - Common abbreviations: ت = tablet, ك = capsule, ش = syrup
   - Numbers may be written as: ١٢٣ or 123 or one/two/three
   - "مرة" = once, "مرتين" = twice, "٣ مرات" = 3 times
   - "قبل الأكل" = before meals, "بعد الأكل" = after meals

3. **COMMON EGYPTIAN MEDICATIONS REFERENCE** (use to verify your reading):
   - مسكنات: Panadol, Cataflam, Brufen, Voltaren
   - مضادات حيوية: Augmentin, Hibiotic, Klacid, Zithromax
   - أدوية صدرية: Ventolin, Berodual, Singulair, Aerius
   - أدوية معدة: Controloc, Nexium, Gaviscon, Motilium
   - فيتامينات: Vitamin D3, B-Complex, Zinc, Omega-3

4. **NEVER INVENT MEDICATION NAMES**:
   - If you can't read a name clearly, write it EXACTLY as you see it (even if misspelled)
   - Set "confidence" to a low value (0.3-0.5) for unclear text
   - Mark uncertain readings in "notes"

5. **OUTPUT FORMAT**: Return ONLY valid JSON with this structure:

{
  "medicines": [
    {
      "medicine_name": "الاسم الأصلي كما في الروشتة (عربي أو إنجليزي)",
      "medicine_name_en": "English brand name if confident, otherwise null",
      "dosage": "الجرعة والشكل: 1 tablet, 5ml syrup, etc.",
      "frequency": "التكرار: 3 times daily, every 8 hours, etc.",
      "duration": "المدة: 5 days, 1 week, etc. (or empty if not specified)",
      "notes": "ملاحظات خاصة: after meals, before sleep, etc.",
      "confidence": 0.85,
      "raw_text": "النص الخام المقروء من الصورة لهذا الدواء"
    }
  ],
  "overall_quality": "good|fair|poor",
  "reading_notes": "أي ملاحظات عامة عن جودة الخط أو الصورة"
}

## EXAMPLES:

Input: روشتة مكتوبة "استيل سيستايين فوار 600 - قرص فوار مرتين يومياً"
Output:
{
  "medicine_name": "استيل سيستايين فوار 600",
  "medicine_name_en": "Acetylcysteine 600",
  "dosage": "1 effervescent tablet",
  "frequency": "twice daily",
  "duration": "",
  "notes": "",
  "confidence": 0.9,
  "raw_text": "استيل سيستايين فوار 600"
}

NOW ANALYZE THIS PRESCRIPTION IMAGE:`;

    const completion = await groq.chat.completions.create({
      model: visionModel,
      temperature: 0.15,
      max_tokens: 3000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    });

    const rawText = completion.choices?.[0]?.message?.content?.trim() || '{}';

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const start = rawText.indexOf('{');
      const end = rawText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        parsedData = JSON.parse(rawText.substring(start, end + 1));
      } else {
        throw new Error('فشل فك التنسيق الهيكلي للبيانات.');
      }
    }

    const rawMedicines = parsedData.medicines || [];
    if (!Array.isArray(rawMedicines)) {
      throw new Error('مخرجات الـ AI لا تحتوي على مصفوفة أدوية صالحة.');
    }

    const medicines: ExtractedPrescriptionItem[] = rawMedicines.map((item: any) => {
      const confidence = Math.min(1, Math.max(0, Number(item.confidence) || 0.5));
      
      return {
        medicine_name: String(item.medicine_name || '').trim(),
        medicine_name_en: item.medicine_name_en ? String(item.medicine_name_en).trim() : undefined,
        dosage: String(item.dosage || '').trim(),
        frequency: String(item.frequency || '').trim(),
        duration: String(item.duration || '').trim(),
        notes: String(item.notes || '').trim(),
        confidence,
        raw_text: String(item.raw_text || item.medicine_name || '').trim(),
      };
    }).filter(med => med.medicine_name.length > 0); // Remove empty entries

    const lowConfidenceCount = medicines.filter(m => m.confidence < 0.5).length;
    const overallQuality = parsedData.overall_quality || 
      (lowConfidenceCount > medicines.length / 2 ? 'poor' : 
       lowConfidenceCount > 0 ? 'fair' : 'good');

    return NextResponse.json({
      success: true,
      medicines,
      total: medicines.length,
      overall_quality: overallQuality,
      reading_notes: parsedData.reading_notes || null,
      warnings: {
        low_confidence: lowConfidenceCount,
        poor_quality: overallQuality === 'poor',
      }
    });

  } catch (error: any) {
    console.error('Prescription OCR Pipeline Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'حدث خطأ داخلي أثناء تحليل صورة الروشتة.',
      },
      { status: 500 }
    );
  }
}
