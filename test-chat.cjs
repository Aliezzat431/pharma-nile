const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY not found!');
  process.exit(1);
}

async function testChat() {
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    console.log('⏳ Sending a test question to Groq...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in English and Arabic, and tell me your model name.' }],
      model: 'llama-3.3-70b-versatile', // Using a standard chat model for this test
    });

    console.log('\n🤖 AI Response:');
    console.log(chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChat();
