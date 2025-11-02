# 🧪 Conversations Backend Testing Guide

**Date**: October 25, 2025  
**Status**: Ready for Testing  

---

## 📋 Prerequisites

### 1. Add Tavily API Key

Open `backend/.env` and add:

```env
# Tavily API (Web Search)
TAVILY_API_KEY=tvly-your-actual-api-key-here
```

### 2. Start Backend Server

```powershell
cd C:\mediation-app
npm run start
```

Wait for:
```
✅ Conversations routes mounted at /api/conversations
✅ AI routes mounted at /api/ai
Server running on port 4000
```

---

## 🧪 Test Scenarios

### Test 1: Get Conversations for Case ✅

**Purpose**: Verify user can see their conversations

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/conversations/case/3bcb2937-0e55-451a-a9fd-659187af84d4" `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
  } | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "ok": true,
  "conversations": [
    {
      "id": "uuid",
      "conversation_type": "divorcee_to_mediator",
      "title": "Private Conversation",
      "unread_count": 0,
      "message_count": 2,
      "participants": [...]
    }
  ]
}
```

---

### Test 2: Get Unread Count ✅

**Purpose**: Verify unread count calculation

```powershell
Invoke-RestMethod -Uri "http://localhost:4000/api/conversations/unread/count" `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
  } | ConvertTo-Json
```

**Expected**:
```json
{
  "ok": true,
  "unread": 0
}
```

---

### Test 3: Send Message to Conversation ✅

**Purpose**: Verify message sending

```powershell
$conversationId = "YOUR_CONVERSATION_ID_HERE"

$body = @{
  content = "Test message from PowerShell API"
  attachments = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/conversations/$conversationId/messages" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "ok": true,
  "message": {
    "id": "uuid",
    "content": "Test message from PowerShell API",
    "sender_email": "bob@example.com",
    ...
  }
}
```

---

### Test 4: Question Routing Analysis 🤖

**Purpose**: Verify AI detects misdirected questions

#### Test 4a: Factual Question (should route to web_search)

```powershell
$body = @{
  question = "What is the average child support payment in California?"
  current_recipient = "other_divorcee"
  user_role = "divorcee"
  available_recipients = @("mediator", "other_divorcee")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/analyze-question-routing" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "ok": true,
  "routing": {
    "question_type": "factual_legal",
    "is_misdirected": true,
    "best_recipient": "web_search",
    "confidence": 0.9,
    "reason": "This is a factual question requiring statistics",
    "suggested_action": "web_search"
  }
}
```

#### Test 4b: Legal Question (should route to mediator)

```powershell
$body = @{
  question = "Can you approve this custody arrangement?"
  current_recipient = "other_divorcee"
  user_role = "divorcee"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/analyze-question-routing" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "routing": {
    "question_type": "legal_procedural",
    "is_misdirected": true,
    "best_recipient": "mediator",
    "suggested_action": "redirect"
  }
}
```

---

### Test 5: Web Search (Tavily) 🔍

**Purpose**: Verify Tavily integration works

#### Test 5a: Legal Search

```powershell
$body = @{
  query = "California child support guidelines 2025"
  search_type = "legal"
  jurisdiction = "California"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/search-web" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "ok": true,
  "query": "California child support guidelines 2025",
  "answer": "The California child support guidelines...",
  "results": [
    {
      "title": "California Courts - Child Support",
      "url": "https://courts.ca.gov/...",
      "content": "...",
      "score": 0.95
    }
  ],
  "citations": [
    {
      "source": "California Courts",
      "url": "https://...",
      "snippet": "..."
    }
  ],
  "source": "tavily_web_search"
}
```

#### Test 5b: Statistics Search

```powershell
$body = @{
  query = "divorce rate statistics United States 2025"
  search_type = "statistics"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/search-web" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

---

### Test 6: Enhanced Message Analysis 🤖

**Purpose**: Verify anti-hallucination safeguards

#### Test 6a: Message with Factual Claim

```powershell
$body = @{
  content = "I read that 80% of divorces involve custody disputes"
  context = "divorce_mediation"
  recipient_role = "mediator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/analyze-message-enhanced" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "ok": true,
  "analysis": {
    "tone": "neutral",
    "contains_factual_claims": true,
    "factual_claims": ["80% of divorces involve custody disputes"]
  },
  "metadata": {
    "source": "ai_analysis",
    "confidence": 0.8,
    "requires_verification": true
  }
}
```

#### Test 6b: Hostile Message

```powershell
$body = @{
  content = "I DEMAND you send those documents NOW!"
  context = "divorce_mediation"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/ai/analyze-message-enhanced" `
  -Method POST `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
    "Content-Type"="application/json"
  } `
  -Body $body | ConvertTo-Json -Depth 5
```

**Expected**:
```json
{
  "analysis": {
    "tone": "hostile",
    "tone_explanation": "Message uses demanding language and all caps",
    "warnings": [
      "All caps indicates shouting",
      "Demanding tone may escalate conflict",
      "No specific deadline provided"
    ]
  }
}
```

---

### Test 7: Audit Trail Verification 📊

**Purpose**: Verify AI responses are logged

```powershell
# After running several AI tests, check audit trail
Invoke-RestMethod -Uri "http://localhost:4000/api/debug/whoami" `
  -Headers @{
    "X-Dev-User-Id"="22222222-2222-2222-2222-222222222222"
    "X-Dev-Email"="bob@example.com"
    "X-Dev-Role"="divorcee"
  }
```

Then check database directly:
```sql
SELECT 
  user_id,
  source_type,
  confidence_score,
  requires_verification,
  created_at
FROM ai_responses
WHERE user_id = '22222222-2222-2222-2222-222222222222'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Success Criteria

### Conversation Endpoints
- [ ] GET /api/conversations/case/:caseId returns conversations
- [ ] GET /api/conversations/unread/count returns correct count
- [ ] POST /api/conversations/:id/messages sends message
- [ ] GET /api/conversations/:id/messages retrieves messages
- [ ] POST /api/conversations/:id/read updates last_read_at
- [ ] Access control prevents unauthorized access

### AI Endpoints
- [ ] Question routing detects factual questions → web_search
- [ ] Question routing detects legal questions → mediator
- [ ] Web search returns results with citations
- [ ] Enhanced analysis flags factual claims
- [ ] Enhanced analysis detects tone correctly
- [ ] All AI responses logged to audit trail

### Tavily Integration
- [ ] Tavily API key configured
- [ ] Legal search returns law sources
- [ ] Statistics search returns data sources
- [ ] Citations included in all results
- [ ] Confidence scores present

---

## 🐛 Troubleshooting

### Error: "Tavily API key not configured"

**Fix**: Add `TAVILY_API_KEY=tvly-...` to `backend/.env`

### Error: "Cannot find module '@tavily/core'"

**Fix**: 
```powershell
cd backend
npm install tavily
```

### Error: "Access denied to this case"

**Fix**: Use correct user ID that's a participant in the case

### Error: "conversation_id does not exist"

**Fix**: First get conversations for the case, then use a valid conversation_id

---

## 📝 Test Results Template

```markdown
# Test Results - October 25, 2025

## Conversation Endpoints
- [ ] GET case conversations: ✅/❌
- [ ] GET unread count: ✅/❌
- [ ] POST send message: ✅/❌
- [ ] GET messages: ✅/❌
- [ ] POST mark read: ✅/❌

## AI Routing
- [ ] Factual question detection: ✅/❌
- [ ] Legal question detection: ✅/❌
- [ ] System question detection: ✅/❌

## Web Search
- [ ] Legal search: ✅/❌
- [ ] Statistics search: ✅/❌
- [ ] Citations present: ✅/❌

## Enhanced Analysis
- [ ] Tone detection: ✅/❌
- [ ] Factual claim flagging: ✅/❌
- [ ] Audit trail logging: ✅/❌

## Notes:
- [Add any observations or issues here]
```

---

**Ready to test!** 🚀

Add your Tavily API key and run through these tests.
