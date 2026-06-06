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
      return NextResponse.json({ error: 'GROQ_API_KEY missing' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('invoice') as File | null;
    if (!file) return NextResponse.json({ error: 'No invoice image' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Using the 2026 Llama 4 model we identified
    const visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';

    const prompt = `You are a professional medical invoice extractor. 
    Analyze this Arabic invoice (from Al-Hussein Hospital) and extract the items from the table.
    
    Focus on columns:
    1. 'اسم الصنف' -> product_name (Translate to English, e.g. 'Paramol', 'Augmentin')
    2. 'الكمية المنصرفة' -> quantity (Integer)
    3. 'سعر الوحدة' -> public_price (Number, EGP)
    
    Rules:
    - IGNORE watermarks like 'Page 3'.
    - Product names MUST be translated to English.
    - Return a JSON array ONLY.
    
    Format:
    [{"product_name": "Product Name", "quantity": 1, "public_price": 10.5, "purchase_price": 0.0, "expiry_date": "2027-12-31", "barcode": ""}]
    `;

    const completion = await groq.chat.completions.create({
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
      model: visionModel,
      temperature: 0.1,
      max_tokens: 2048,
    });

    const rawText = completion.choices[0]?.message?.content || '';

    // Strip markdown fences if present (```json ... ``` or ``` ... ```)
    const stripped = rawText
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    // Find the outermost JSON array using bracket depth counting
    // (simple regex stops at first ], which breaks on nested objects)
    function extractOutermostArray(text: string): string | null {
      const start = text.indexOf('[');
      if (start === -1) return null;
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '[') depth++;
        else if (text[i] === ']') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      return null;
    }

    const jsonStr = extractOutermostArray(stripped) ?? extractOutermostArray(rawText);
    if (!jsonStr) throw new Error('Could not find a JSON array in the AI response.');

    let items: any[];
    try {
      items = JSON.parse(jsonStr);
    } catch (parseErr: any) {
      console.error('JSON parse failed. Raw text was:', rawText);
      throw new Error(`AI returned malformed JSON: ${parseErr.message}`);
    }

    const processedItems = items.map((item: any) => ({
      product_name:   String(item.product_name || 'Unknown').trim(),
      quantity:       Math.max(1, Math.round(Number(item.quantity) || 1)),
      public_price:   Math.max(0, Number(item.public_price ?? item.price) || 0),
      purchase_price: Math.max(0, Number(item.purchase_price) || 0),
      expiry_date:    item.expiry_date || '2027-12-31',
      barcode:        item.barcode ? String(item.barcode).trim() : '',
      is_new:         true,
    }));

    return NextResponse.json({ items: processedItems, total: processedItems.length });
  } catch (error: any) {
    console.error('OCR Error:', error);
    return NextResponse.json({ error: error?.message || 'Processing failed' }, { status: 500 });
  }
}
