# AI Features Testing Guide

## ✅ OpenAI API Status
- **API Key**: Configured and validated
- **Model**: gpt-4o-mini-2024-07-18
- **Status**: ✅ Working (verified with test-openai.js)

## 🎯 How to Test AI Features

### Method 1: Visual Test Dashboard (Recommended)

1. **Start the servers**:
   ```powershell
   npm run start
   ```

2. **Open the test dashboard**:
   - Open `test-ai-dashboard.html` in your browser
   - Or navigate to: `file:///C:/mediation-app/test-ai-dashboard.html`

3. **Test each feature**:
   - Click on each "Run Test" button
   - Sample data is pre-filled for you
   - Results will appear below each test
   - Green = Success, Red = Error

4. **Features you can test**:
   - ✅ Health Check
   - 💬 Chat Summarization
   - 🎭 Emotional Tone Detection
   - 🔑 Key Points Extraction
   - 💡 Neutral Phrasing Suggestions
   - ⚖️ Legal Guidance

### Method 2: From the Mediation App

1. **Login as mediator**:
   - Email: `attie@ngwaverley.co.za`
   - Password: Your password

2. **Navigate to a case**:
   - Go to Case Workspace
   - Open the chat or session notes

3. **Look for AI buttons**:
   - "Summarize" button on chat messages
   - "Analyze Tone" on messages
   - "Get AI Insights" in case overview
   - "Suggest Neutral Phrasing" in chat input

### Method 3: Using Postman or Thunder Client

Import this collection of AI endpoints:

#### 1. Health Check
```
GET http://localhost:4000/api/ai/health
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

#### 2. Chat Summarization
```
POST http://localhost:4000/api/ai/summarize
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "messages": [
    {
      "sender": "Party A",
      "message": "I think we should split the assets 50/50.",
      "timestamp": "2025-10-22T10:00:00Z"
    },
    {
      "sender": "Party B",
      "message": "I disagree! I contributed more to our savings.",
      "timestamp": "2025-10-22T10:01:00Z"
    }
  ]
}
```

#### 3. Emotional Tone Detection
```
POST http://localhost:4000/api/ai/analyze-emotion
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "text": "I'm really frustrated with how this is going!"
}
```

#### 4. Key Points Extraction
```
POST http://localhost:4000/api/ai/extract-key-points
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "transcript": "Mediator: Let's discuss custody. Party A: I want shared custody. Party B: I agree but have concerns about logistics."
}
```

#### 5. Neutral Phrasing
```
POST http://localhost:4000/api/ai/suggest-phrasing
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "text": "You never listen to me! You always make it about yourself!"
}
```

#### 6. Legal Guidance
```
POST http://localhost:4000/api/ai/legal-guidance
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body:
{
  "question": "How is marital property divided in South Africa?",
  "context": "divorce mediation"
}
```

## 🔐 Getting Your JWT Token

### Option 1: From Browser DevTools
1. Login to the app
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Type: `localStorage.getItem('token')`
5. Copy the token value

### Option 2: From .env file
Use the TEST_JWT from your `.env` file:
```
TEST_JWT=eyJhbGci...
```

## 📊 Expected Responses

### Health Check Response:
```json
{
  "status": "healthy",
  "openai": {
    "configured": true,
    "model": "gpt-4o-mini"
  },
  "timestamp": "2025-10-22T..."
}
```

### Chat Summary Response:
```json
{
  "summary": "Party A proposes a 50/50 asset split...",
  "keyPoints": ["Asset division", "Fair distribution"],
  "tone": "negotiating",
  "recommendations": ["Continue discussion", "Review financial records"]
}
```

### Emotional Tone Response:
```json
{
  "emotion": "frustrated",
  "intensity": "high",
  "confidence": 0.85,
  "suggestions": ["Take a break", "Acknowledge feelings"]
}
```

## 🎨 AI Features in the App

The AI is integrated into:

1. **Chat Module**: 
   - Auto-summarize conversations
   - Detect emotional escalation
   - Suggest neutral rephrasing

2. **Session Notes**:
   - Extract key discussion points
   - Generate session summaries
   - Identify unresolved issues

3. **Case Dashboard**:
   - AI insights widget
   - Risk assessment
   - Progress tracking

4. **Document Review**:
   - Extract important clauses
   - Summarize legal documents
   - Flag potential issues

## 🐛 Troubleshooting

### "Invalid token" error:
- Make sure you're logged in
- Check that your JWT token is valid
- Token expires after 7 days - login again

### "OpenAI API error":
- Check that OPENAI_API_KEY is set in backend/.env
- Verify API key is valid at https://platform.openai.com
- Check if you have API credits

### "Failed to fetch":
- Make sure backend server is running on port 4000
- Check that CORS is enabled for your origin
- Try clearing browser cache

## 💰 API Usage

Each AI call costs tokens:
- Chat Summarization: ~100-300 tokens
- Emotional Tone: ~50-100 tokens
- Key Points: ~150-400 tokens
- Neutral Phrasing: ~100-200 tokens
- Legal Guidance: ~300-800 tokens

Current rate (gpt-4o-mini):
- Input: $0.15 per 1M tokens
- Output: $0.60 per 1M tokens

Very affordable for typical usage!

## 📝 Next Steps

1. Open `test-ai-dashboard.html` in your browser
2. Click through each test to verify functionality
3. Check responses are relevant and helpful
4. Try the AI features in the actual app
5. Monitor usage in OpenAI dashboard

---

**Ready to test!** 🚀 Just open the HTML file or use the app directly.
