# 🚀 Quick Restart Guide for Phase 4.2.1 Testing

## Current Situation
The automatic AI analysis code is complete and deployed, but the running server 
needs to be restarted to load the latest changes.

## Restart Instructions

### Step 1: Stop the Running Server
In your **other terminal** where the server is running:
```
Press: Ctrl + C
```

### Step 2: Restart the Server
Choose ONE of these options:

**Option A: Full Stack (Backend + Frontend)**
```powershell
cd c:\mediation-app
npm run dev
```

**Option B: Backend Only**
```powershell
cd c:\mediation-app\backend
npm run dev
```

**Option C: Direct Node**
```powershell
cd c:\mediation-app\backend
node src/index.js
```

### Step 3: Wait for Server to Start
You should see:
```
Server running on port 4000
Chat routes mounted at /api/chat
AI routes mounted at /api/ai
```

### Step 4: Run Verification Test
In this terminal:
```powershell
cd c:\mediation-app\backend
.\test-simple-verify.ps1
```

## Expected Success Output
```
========================================
PHASE 4.2.1 VERIFICATION TEST
========================================

Step 1: Creating test message...
Message created: [uuid]

Step 2: Waiting 10 seconds for AI analysis...
  1 seconds...
  ...
  10 seconds...

Step 3: Checking database...
Checking for AI insights in database...
Found 2 insights for message [uuid]:

1. TONE_ANALYSIS
   - Emotional tone: frustrated
   - Intensity: 8/10
   - Auto-generated: true

2. RISK_ASSESSMENT
   - Risk level: medium-high
   - Confidence: high
   - Auto-generated: true

SUCCESS! Phase 4.2.1 is COMPLETE!
AI insights are being generated automatically!
```

## What the Server Logs Should Show
When you create a message after restart, watch for:
```
[chat:messages:post] created message [id]
[chat:messages:post] Triggering AI analysis for message [id], case [case-id]
[chat:ai-analysis] Starting AI analysis for message [id]
[chat:ai-analysis] Calling AI service for tone analysis...
[chat:ai-analysis] Tone analysis result: {...}
[chat:ai-analysis] Calling AI service for risk assessment...
[chat:ai-analysis] Risk assessment result: {...}
[chat:ai-analysis] Stored tone analysis for message [id]
[chat:ai-analysis] Stored risk assessment for message [id]
[chat:ai-analysis] Completed AI analysis for message [id]
```

## Troubleshooting

### If still no insights after restart:
1. Check server logs for any errors
2. Verify OpenAI API key is set in .env
3. Run: `node setup-dev-user.js` to ensure user access
4. Check that case_id is being sent with messages

### If you see errors in server logs:
- Share the error message
- Check that all dependencies are installed: `npm install`

## Quick Health Check (Optional)
Test AI service independently:
```powershell
cd c:\mediation-app\backend
node -e "
import('./src/services/aiService.js').then(async (module) => {
  const aiService = module.default;
  const health = await aiService.healthCheck();
  console.log('AI Health:', health ? '✅ OK' : '❌ FAIL');
  process.exit(health ? 0 : 1);
});
"
```

---

**Ready?** Restart your server in the other terminal, then run the test! 🚀