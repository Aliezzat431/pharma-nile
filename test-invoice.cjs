const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ Error: GROQ_API_KEY not found in .env.local');
  process.exit(1);
}

// Simple logic to test Groq Vision directly
async function testScan(imagePath) {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    console.log(`📂 Reading image: ${imagePath}...`);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    console.log('🤖 Sending to Llama 4 Vision...');
    const result = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract invoice items into JSON array. Translate names to English." },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
    });

    console.log('\n✅ AI Response:');
    console.log('----------------------------');
    console.log(result.choices[0]?.message?.content);
    console.log('----------------------------');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Usage: node test-invoice.js path/to/image.jpg
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('ℹ️ Usage: node test-invoice.js <image_path>');
} else {
  testScan(args[0]);
}
