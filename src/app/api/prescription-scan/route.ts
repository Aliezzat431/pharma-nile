import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export interface ExtractedPrescriptionItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export async function POST(req: Request) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY missing' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('prescription') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No prescription image provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const groq = new Groq({
      apiKey: GROQ_API_KEY,
    });

    const prompt = `
You are an expert pharmacist and medical prescription reader.

Analyze the prescription image carefully.

Extract ALL medications mentioned.

Return ONLY valid JSON array.

Rules:

- Do NOT explain anything.
- Do NOT use markdown.
- Keep medicine names exactly as written.
- If unsure, use empty string.
- Extract dosage, frequency and duration if available.
- Ignore doctor names, stamps and signatures.
- Ignore patient information.

Return format:

[
  {
    "medicine_name": "",
    "dosage": "",
    "frequency": "",
    "duration": "",
    "notes": ""
  }
]
`;

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      temperature: 0.1,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
              },
            },
          ],
        },
      ],
    });

    const rawText =
      completion.choices?.[0]?.message?.content?.trim() || '';

    const cleaned = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');

    if (start === -1 || end === -1) {
      throw new Error('No JSON array found');
    }

    const jsonText = cleaned.substring(start, end + 1);

    let items: any[] = [];

    try {
      items = JSON.parse(jsonText);
    } catch (err) {
      console.error(cleaned);
      throw new Error('Failed parsing AI response');
    }

    const medicines = items.map((item) => ({
      medicine_name: String(item.medicine_name || '').trim(),
      dosage: String(item.dosage || '').trim(),
      frequency: String(item.frequency || '').trim(),
      duration: String(item.duration || '').trim(),
      notes: String(item.notes || '').trim(),
    }));

    return NextResponse.json({
      medicines,
      total: medicines.length,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || 'Prescription processing failed',
      },
      {
        status: 500,
      }
    );
  }
}