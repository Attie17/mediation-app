import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🔍 Testing OpenAI API Configuration...\n');

// Check if API key is loaded
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.log('❌ OPENAI_API_KEY not found in backend/.env');
  process.exit(1);
}

console.log(`✅ API Key loaded: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 4)}`);
console.log(`📝 Key length: ${apiKey.length} characters\n`);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: apiKey,
});

console.log('🚀 Testing OpenAI API with simple completion...\n');

try {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond very briefly.',
      },
      {
        role: 'user',
        content: 'Say "API is working!" if you can hear me.',
      },
    ],
    max_tokens: 20,
    temperature: 0.7,
  });

  console.log('✅ OpenAI API is working!');
  console.log(`📤 Response: ${completion.choices[0].message.content}`);
  console.log(`🎯 Model used: ${completion.model}`);
  console.log(`💰 Tokens used: ${completion.usage.total_tokens}\n`);
  
  console.log('✨ All systems go! OpenAI API is functioning correctly.');
  
} catch (error) {
  console.log('❌ OpenAI API Error:');
  console.log(`   Message: ${error.message}`);
  if (error.response) {
    console.log(`   Status: ${error.response.status}`);
    console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
  }
  console.log('\n💡 Possible issues:');
  console.log('   - Invalid API key');
  console.log('   - Insufficient API credits');
  console.log('   - Network connectivity issues');
  console.log('   - API key doesn\'t have GPT-4o-mini access');
  
  process.exit(1);
}
