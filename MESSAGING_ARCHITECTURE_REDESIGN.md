# 🔄 Messaging Architecture Redesign

**Date**: October 25, 2025  
**Status**: Design Phase  
**Priority**: CRITICAL - Required before testing

---

## 🎯 Requirements

### Conversation Types Required

A typical divorce mediation case has **3 participants**:
1. **Divorcee A** (e.g., Bob)
2. **Divorcee B** (e.g., Jill) - the other spouse
3. **Mediator** (e.g., Alice)

### Required Conversations per Case

#### 1. **Private 1-to-1 Conversations** (3 conversations)
- Divorcee A ↔ Divorcee B (direct communication between spouses)
- Divorcee A ↔ Mediator (private consultation)
- Divorcee B ↔ Mediator (private consultation)

#### 2. **Group Conversation** (1 conversation)
- All three participants can see and contribute
- Transparent communication
- Used for joint sessions, agreements, announcements

#### 3. **Admin Access**
- Admin can view and participate in **any conversation** across **all cases**
- Used for: support, moderation, system announcements
- Special admin-initiated conversations for platform-wide messages

---

## 🚨 Current System Limitations

### Problem 1: No Conversation Context
```sql
-- Current schema
CREATE TABLE messages (
  sender_id UUID,
  recipient_id UUID,  -- ❌ Only supports 1-to-1
  ...
);
```

**Issues**:
- Cannot have group messages (3+ participants)
- No way to distinguish conversation types
- Cannot track conversation metadata

### Problem 2: No AI Safeguards
Current AI assistant:
- ❌ Doesn't detect misdirected questions
- ❌ May hallucinate answers
- ❌ Doesn't redirect to web search for facts
- ❌ Doesn't suggest correct recipient

### Problem 3: No Admin Universal Access
- Admin cannot see conversations across cases
- No moderation capability
- No way to send system-wide announcements

---

## 🏗️ New Architecture Design

### Database Schema Changes

#### New Table: `conversations`
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  conversation_type TEXT NOT NULL CHECK (
    conversation_type IN (
      'divorcee_to_divorcee',
      'divorcee_to_mediator', 
      'group',
      'admin_support'
    )
  ),
  title TEXT, -- e.g., "Bob & Jill", "Bob & Alice (Private)", "All Participants"
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fetching conversations by case
CREATE INDEX idx_conversations_case_id ON conversations(case_id);
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
```

#### New Table: `conversation_participants`
```sql
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conv_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
```

#### Updated: `messages` Table
```sql
ALTER TABLE messages 
  DROP COLUMN recipient_id, -- Remove 1-to-1 limitation
  ADD COLUMN conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE;

-- New index
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

---

## 🤖 AI Redirect System

### Feature 1: Detect Misdirected Questions

**Examples of misdirection**:

```
User: "What is the median child support amount in California?"
→ AI: "This is a factual legal question. I can search the web for California 
      child support guidelines. Would you like me to do that?"
→ AI: [Performs web search, provides answer with citations]
```

```
User (to other divorcee): "Can you approve this custody arrangement?"
→ AI: "Legal approvals should be directed to your mediator or lawyer.
      Would you like me to send this question to your mediator instead?"
→ AI: [Offers to create draft message to mediator]
```

```
User (to mediator): "What's the status of my financial disclosure upload?"
→ AI: "This is a system question. You can check your document status in the
      Documents section of your dashboard. [Link to Documents]"
```

### Feature 2: Hallucination Prevention

#### Strategy 1: Require Citations
```javascript
// AI Prompt Enhancement
const ANTI_HALLUCINATION_PROMPT = `
CRITICAL RULES - YOU MUST FOLLOW THESE:
1. If you don't know something, say "I don't know"
2. NEVER make up statistics, dates, or legal facts
3. For factual questions, offer to search the web
4. For legal advice, redirect to mediator/lawyer
5. For system questions, provide dashboard links
6. Always cite sources when providing information
7. Distinguish between:
   - Your analysis (clearly labeled as AI opinion)
   - Facts from documents (cite the document)
   - Legal information (require verification)
`;
```

#### Strategy 2: Citation Format
```json
{
  "response": "According to the California Family Code Section 4055...",
  "source": "web_search",
  "citation": "CA Family Code §4055 (retrieved Oct 25, 2025)",
  "confidence": "high",
  "requires_verification": false
}

// OR

{
  "response": "Based on the uploaded financial disclosure...",
  "source": "user_document",
  "citation": "Financial_Disclosure_Bob_2025.pdf, page 3",
  "confidence": "high", 
  "requires_verification": false
}

// OR

{
  "response": "I don't have specific information about custody statistics.",
  "source": "none",
  "suggestion": "I can search the web for recent custody statistics. Would you like me to?",
  "requires_verification": true
}
```

#### Strategy 3: Audit Trail
```sql
CREATE TABLE ai_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES messages(id),
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('ai_analysis', 'web_search', 'document', 'redirect')),
  citations JSONB, -- Array of sources
  confidence_score FLOAT, -- 0.0 to 1.0
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Feature 3: Smart Routing

```javascript
// AI analyzes question and suggests routing
const analyzeQuestionRouting = async (question, currentRecipient) => {
  const analysis = await ai.analyze({
    question,
    currentRecipient,
    analysis: [
      'question_type', // factual, legal, procedural, emotional, system
      'best_recipient', // mediator, lawyer, other_divorcee, admin, web_search, dashboard
      'urgency', // low, medium, high
      'requires_professional' // true/false
    ]
  });
  
  if (analysis.question_type === 'factual') {
    return {
      action: 'web_search',
      message: 'This appears to be a factual question. I can search the web for accurate information.'
    };
  }
  
  if (analysis.question_type === 'legal' && currentRecipient !== 'mediator') {
    return {
      action: 'redirect',
      suggested_recipient: 'mediator',
      message: 'Legal questions should be directed to your mediator. Would you like me to help draft this question for them?'
    };
  }
  
  if (analysis.question_type === 'system') {
    return {
      action: 'dashboard_link',
      link: '/divorcee/documents',
      message: 'You can check this in your Documents section.'
    };
  }
  
  return {
    action: 'proceed',
    message: null
  };
};
```

---

## 🔧 Implementation Plan

### Phase 1: Database Migration (High Priority)
**Time**: 1 hour

1. Create `conversations` table
2. Create `conversation_participants` table
3. Migrate existing messages to conversation model
4. Update `messages` table (remove recipient_id, add conversation_id)

**Migration Strategy**:
```sql
-- Step 1: Create new tables
-- Step 2: For each case, auto-create 4 conversations:
--   - divorcee_to_divorcee
--   - divorcee_to_mediator (participant 1)
--   - divorcee_to_mediator (participant 2)
--   - group (all 3)
-- Step 3: Migrate existing messages
-- Step 4: Drop recipient_id column
```

### Phase 2: Backend API Updates (High Priority)
**Time**: 1.5 hours

**New Endpoints**:
```
GET    /api/conversations/case/:caseId          - List all conversations
GET    /api/conversations/:conversationId       - Get conversation details
POST   /api/conversations                       - Create new conversation
GET    /api/conversations/:id/messages          - Get messages (replaces old endpoint)
POST   /api/conversations/:id/messages          - Send message
POST   /api/conversations/:id/read              - Mark all as read
GET    /api/conversations/admin/all             - Admin: all conversations
```

**Updated AI Endpoints**:
```
POST   /api/ai/analyze-question-routing         - Detect misdirection
POST   /api/ai/search-web                       - Factual question search
POST   /api/ai/analyze-message                  - Enhanced with citations
```

### Phase 3: Frontend Redesign (High Priority)
**Time**: 2 hours

**New Pages/Components**:
1. `ConversationsListPage.jsx` - Shows all available conversations
2. `ConversationView.jsx` - Individual conversation (replaces MessagesPage)
3. `ConversationSelector.jsx` - Dropdown to switch conversations
4. `AIRedirectModal.jsx` - Suggests better recipient
5. `AISourceCitation.jsx` - Shows source of AI information

**Updated Components**:
- `AIMessageAssistant.jsx` - Add routing detection, citation display
- `Sidebar.jsx` - Update Messages to show conversation count

### Phase 4: AI Safeguards (Critical)
**Time**: 1 hour

1. Update AI prompts with anti-hallucination rules
2. Add citation extraction logic
3. Add web search integration (if available)
4. Add confidence scoring
5. Create audit trail

### Phase 5: Admin Features (Medium Priority)
**Time**: 1 hour

1. Admin conversations view (all cases)
2. Admin moderation tools
3. System-wide announcements

### Phase 6: Testing (High Priority)
**Time**: 1 hour

Test all conversation types, AI redirects, hallucination prevention

---

## 📊 Example Conversation Structure

### Case: Bob vs Jill (Mediator: Alice)

```
Conversations for Case ID: 3bcb2937-0e55-451a-a9fd-659187af84d4

1. 🔒 Bob ↔ Jill (Private)
   Type: divorcee_to_divorcee
   Participants: Bob, Jill
   Last message: "Can we discuss the custody schedule?" (2 hours ago)
   Unread: 1

2. 🔒 Bob ↔ Alice (Private) 
   Type: divorcee_to_mediator
   Participants: Bob, Alice
   Last message: "I have questions about the settlement" (1 day ago)
   Unread: 0

3. 🔒 Jill ↔ Alice (Private)
   Type: divorcee_to_mediator
   Participants: Jill, Alice
   Last message: "Thank you for the update" (3 hours ago)
   Unread: 0

4. 👥 All Participants (Group)
   Type: group
   Participants: Bob, Jill, Alice
   Last message: "Let's schedule our next session" (5 hours ago)
   Unread: 2
```

---

## 🎯 AI Examples

### Example 1: Factual Question Detection

**User message**: "What is the average child support payment in California?"

**AI Response**:
```json
{
  "analysis": {
    "question_type": "factual_legal",
    "can_answer_from_knowledge": false,
    "requires_web_search": true,
    "suggested_action": "web_search"
  },
  "message": "This is a factual question that requires current statistics. I can search the web for accurate California child support averages. Would you like me to do that?",
  "buttons": [
    {"label": "Yes, search the web", "action": "web_search"},
    {"label": "No, send to mediator", "action": "redirect_mediator"}
  ]
}
```

### Example 2: Misdirected Question

**User** (Bob, messaging Jill): "Can you approve the custody arrangement?"

**AI Response**:
```json
{
  "analysis": {
    "question_type": "legal_procedural",
    "misdirected": true,
    "current_recipient": "Jill (other divorcee)",
    "suggested_recipient": "Alice (mediator)",
    "reason": "Custody approvals require mediator facilitation"
  },
  "warning": "⚠️ Custody arrangements typically require mediator review. Your mediator Alice should facilitate this discussion.",
  "suggestion": "Would you like me to help you draft this question for Alice instead?",
  "draft": "Hi Alice, I'd like to discuss the proposed custody arrangement with both you and Jill. Can we schedule a group session?"
}
```

### Example 3: Hallucination Prevention

**User**: "What did my spouse say about the house in their financial disclosure?"

**AI Analysis**:
```json
{
  "can_answer": false,
  "reason": "I don't have access to uploaded financial documents",
  "suggestion": "You can view uploaded financial disclosures in your Documents section.",
  "dashboard_link": "/divorcee/documents/financial-disclosures",
  "alternative": "If you'd like to discuss the house division, I can help you draft a message to your mediator."
}
```

**AI REFUSES to hallucinate**: ✅
```
❌ WRONG: "Based on the document, your spouse valued the house at $450,000..."
✅ RIGHT: "I don't have access to uploaded documents. You can view the 
          financial disclosure in your Documents section."
```

---

## 🚀 Total Implementation Time

**Phase 1**: Database - 1 hour  
**Phase 2**: Backend - 1.5 hours  
**Phase 3**: Frontend - 2 hours  
**Phase 4**: AI Safeguards - 1 hour  
**Phase 5**: Admin - 1 hour  
**Phase 6**: Testing - 1 hour  

**Total**: ~7.5 hours

---

## 🎯 Next Steps

**Immediate Action**:
1. Review this design
2. Get user approval
3. Start with Phase 1 (Database Migration)
4. Incrementally test each phase

**Questions for User**:
1. Should admin be able to message all users, or just view conversations?
2. Should there be lawyer 1-to-1 conversations too?
3. Do we need message translation (multilingual support)?
4. Should AI have access to uploaded documents for citation?

---

## 📋 Success Criteria

✅ Each case has 4 default conversations  
✅ Users can only see their authorized conversations  
✅ Group messages visible to all 3 participants  
✅ Admin can access any conversation  
✅ AI detects misdirected questions  
✅ AI never hallucinates facts  
✅ AI provides citations for all information  
✅ AI redirects factual questions to web search  
✅ AI suggests correct recipient when misdirected  
✅ Audit trail for all AI responses  

**Ready to implement?** 🚀
