import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { treatmentTypes } from '@/lib/unitOptions';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('GEMINI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export async function POST(req: Request) {
  try {
    const { productName } = await req.json();

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    const availableTypes = treatmentTypes.map((t) => t.name).join(', ');

    const promptText = `
You are a pharmaceutical expert assistant in Egypt.

Analyze the following product name:
"${productName}"

Return ONLY valid JSON without markdown, explanations, comments, or code blocks.

The JSON must have exactly this structure:

{
  "name": "Standardized medicine name",
  "company": "Manufacturer company",
  "type": "One of these exact values: ${availableTypes}",
  "unit_conversion": 1
}

Rules:
- type must exactly match one of the provided values.
- unit_conversion must be a number.
- If information is unknown, make the best reasonable pharmaceutical guess.
- Return JSON only.
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });

    const result = await model.generateContent(promptText);

    const response = await result.response;

    let rawText = response.text()?.trim() || '';

    rawText = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('No JSON found in Gemini response:', rawText);

      return NextResponse.json(
        { error: 'No valid JSON returned from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const normalizedResponse = {
      name: parsed.name || productName,
      company: parsed.company || '',
      type: parsed.type || '',
      unit_conversion: Number(parsed.unit_conversion) || 1,
    };

    return NextResponse.json(normalizedResponse);
  } catch (error: any) {
    console.error('AI Auto-fill Error:', error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          'Failed to generate medicine information',
      },
      { status: 500 }
    );
  }
}