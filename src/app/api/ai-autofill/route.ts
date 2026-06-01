import { NextResponse } from 'next/server';
import { treatmentTypes } from '@/lib/unitOptions';

const MISTRAL_ENDPOINT = "https://api.mistral.ai/v1/chat/completions";
const apiKey = process.env.MISTRAL_API_KEY;
const MISTRAL_MODEL = "mistral-small-latest";

if (!apiKey) {
  console.warn('MISTRAL_API_KEY is not configured'); 
}

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
        { error: 'MISTRAL_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    const availableTypes = treatmentTypes.map((t) => t.name).join(', ');

    const prompt = `
You are a pharmaceutical expert assistant in Egypt.

Analyze the following product name:
"${productName}"

Provide up to 3 of the most likely exact matches or variations of this product (e.g., different concentrations, companies). If the name is specific enough, you can just return 1 match.

Return ONLY valid JSON without markdown, explanations, comments, or code blocks.

The JSON must have exactly this structure:

{
  "choices": [
    {
      "name": "Standardized medicine name",
      "company": "Manufacturer company",
      "type": "One of these exact values: ${availableTypes}",
      "unit_conversion": 1
    }
  ]
}

Rules:
- choices must be an array of objects.
- type must exactly match one of the provided values.
- unit_conversion must be a number.
- The 'name' and 'company' fields MUST be in English (e.g., 'Panadol Extra', not 'بانادول إكسترا').
- If information is unknown, make the best reasonable pharmaceutical guess.
- Return JSON only.
`;

    const response = await fetch(MISTRAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mistral API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content?.trim() ?? '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response:', rawText);
      return NextResponse.json(
        { error: 'No valid JSON returned from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      return NextResponse.json({
        choices: [
          {
            name: parsed.name || productName,
            company: parsed.company || '',
            type: parsed.type || '',
            unit_conversion: Number(parsed.unit_conversion) || 1,
          }
        ]
      });
    }

    const normalizedChoices = parsed.choices.map((choice: any) => ({
      name: choice.name || productName,
      company: choice.company || '',
      type: choice.type || '',
      unit_conversion: Number(choice.unit_conversion) || 1,
    }));

    return NextResponse.json({ choices: normalizedChoices });
  } catch (error: any) {
    console.error('AI Auto-fill Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to generate medicine information',
      },
      { status: 500 }
    );
  }
}