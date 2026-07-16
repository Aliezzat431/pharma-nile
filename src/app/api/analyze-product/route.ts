
import { NextResponse } from 'next/server';
import { treatmentTypes } from '@/lib/unitOptions';
import Groq from 'groq-sdk';
import { getCache, setCache } from '@/lib/redis';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "llama3-70b-8192";

export async function POST(req: Request) {
  try {
    const { productName } = await req.json();

    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );  
    }

    const cacheKey = `cache:product-analysis:${productName.toLowerCase().trim()}`;
    const cachedResult = await getCache<{ choices: any[] }>(cacheKey);
    
    if (cachedResult) {
      console.log(`[Cache Hit] Product analysis for "${productName}" retrieved from Redis.`);
      return NextResponse.json(cachedResult);
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured in .env' },
        { status: 500 }
      );
    }

    const availableTypes = treatmentTypes.map((t) => t.name).join(', ');

    const systemPrompt = `You are a pharmaceutical expert assistant in Egypt, embedded in the PharmaNile ERP system ("Dr. Mohsen").
Your job is to analyze an entered product name and output a clean, well-structured JSON object containing up to 3 likely exact matches or variations available in the Egyptian market.

Available exact types for the "type" field: [${availableTypes}]

Rules:
1. The response MUST be ONLY a single valid JSON object.
2. Do not include any markdown formatting blocks like \`\`\`json, no explanations, and no code blocks.
3. The fields "name" and "company" MUST be in English (e.g., 'Panadol Extra', NOT 'بانادول').
4. The field "type" MUST exactly match one of the values provided above.
5. The field "unit_conversion" must be a positive number (default is 1).

The required JSON schema layout:
{
  "choices": [
    {
      "name": "Standardized medicine name",
      "company": "Manufacturer company name",
      "type": "Matched type from the allowed list",
      "unit_conversion": 1
    }
  ]
}`;

    const userMessage = `Analyze the product name: "${productName}"`;

    const chatCompletion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.1, 
      response_format: { type: "json_object" } 
    });

    const rawText = chatCompletion.choices[0]?.message?.content?.trim() ?? '';

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Groq response:', rawText);
      return NextResponse.json(
        { error: 'No valid JSON returned from AI' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(jsonMatch[0]);

    let normalizedChoices = [];
    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      normalizedChoices = [
        {
          name: parsed.name || productName,
          company: parsed.company || '',
          type: parsed.type || '',
          unit_conversion: Number(parsed.unit_conversion) || 1,
        }
      ];
    } else {
      normalizedChoices = parsed.choices.map((choice: any) => ({
        name: choice.name || productName,
        company: choice.company || '',
        type: choice.type || '',
        unit_conversion: Number(choice.unit_conversion) || 1,
      }));
    }

    const finalResult = { choices: normalizedChoices };
    await setCache(cacheKey, finalResult, 86400); // Cache for 24 hours

    return NextResponse.json(finalResult);

  } catch (error: any) {
    console.error('Groq Auto-fill Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate medicine information' },
      { status: 500 }
    );
  }
}
