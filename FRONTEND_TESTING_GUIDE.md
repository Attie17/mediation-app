# Frontend Testing Guide - Phase 4.2.2 Real-time AI Insights

## 🎯 What You're Testing
Real-time AI insights appearing in the ChatAISidebar as you send messages.

## ✅ Prerequisites
- ✅ Backend running on http://localhost:4000 (Terminal 2)
- ✅ Frontend running on http://localhost:5174 (just restarted)
- ✅ Browser open

## 📋 Step-by-Step Test

### 1. Open the Application
1. Go to: **http://localhost:5174**
2. You should see the login/home page

### 2. Navigate to Chat
Since you need to be logged in and have access to a case with chat:
- If there's a demo/test login, use that
- Or navigate directly to a case you have access to
- Look for a chat interface

### 3. Locate the AI Assistant Sidebar
On the chat page, you should see:
- Main chat area in the center
- **AI Assistant sidebar on the RIGHT side** (width: 320px)
- The sidebar should have sections:
  - Header: "AI Assistant" with "Real-time session insights"
  - High-risk alert banner area (appears when needed)
  - Current Session analysis
  - Tone Coach tool
  - **"Recent AI Analysis"** section ← This is what we're testing!

### 4. Check Existing Insights
The "Recent AI Analysis" section should show:
- Badge with insight count (e.g., "4 insights")
- List of recent auto-generated insights
- Each insight card shows:
  - Icon (🎭 for tone, ⚠️ for risk)
  - Timestamp (HH:MM format)
  - Tone badge or Risk badge
  - Suggestions/recommendations

### 5. Send a Test Message
In the chat input, type an emotional message like:
```
"I'm extremely frustrated with how this is being handled! This is unacceptable!"
```

### 6. Watch for Real-time Updates
**What should happen (within 5-10 seconds):**

1. **Immediate**: Message appears in chat
2. **5-6 seconds**: Backend processes AI analysis
3. **5-10 seconds**: Sidebar updates automatically with:
   - New insight cards appear
   - Insight count badge updates
   - If high-risk: RED ALERT BANNER appears at top!

### 7. Verify High-Risk Alert Banner
If the message triggers high risk, you should see:
- **Red/pink background banner at top of sidebar**
- ⚠️ Warning icon
- "High Risk Detected!" header
- Risk level and score (e.g., "HIGH (8/10)")
- First recommendation
- "Dismiss" button
- **Pulse animation** on the banner
- **Auto-dismisses after 10 seconds**

### 8. Check Insight Details
Each insight card should show:

**For Tone Analysis (🎭):**
- Colored badge: "ANGRY (8/10)" or similar
- Suggestions list with mediator guidance

**For Risk Assessment (⚠️):**
- Colored badge: "HIGH (8/10)" or similar  
- Indicators: phrases that triggered the risk
- Actions: recommendations for mediator

### 9. Test Auto-Refresh
The sidebar polls every 5 seconds. You should notice:
- No page refresh needed
- Insights appear automatically
- No flickering or jumping
- Smooth updates

## 🎨 Visual Checks

### Color Coding
- **Red badges**: High risk (8-10) or angry tone (8-10)
- **Orange badges**: Medium-high (6-7)
- **Yellow badges**: Medium (4-5)
- **Green badges**: Low risk/calm tone (1-3)

### Layout
- Sidebar fixed width (320px)
- Scrollable insight list
- Cards have gray background (#f9fafb)
- Proper spacing between cards

### Animations
- High-risk banner pulses
- Smooth appearance of new insights

## 🐛 Troubleshooting

### "No insights showing"
- Check browser console for errors (F12)
- Verify you're logged in with the dev token
- Ensure the chat channel has a case_id
- Check if backend Terminal 2 shows AI processing logs

### "Insights not updating"
- Check browser console for failed API calls
- Verify polling is working (should see network requests every 5s)
- Check if apiFetch is configured correctly

### "High-risk alert not showing"
- Only shows for risk_level "high" or "critical"
- Must be a NEW insight (checks timestamp)
- Try sending another emotional message

## 📸 What Success Looks Like

You should see:
1. ✅ "Recent AI Analysis" section populated
2. ✅ Badge showing insight count (e.g., "4 insights")
3. ✅ Insight cards with timestamps
4. ✅ Colored badges for tone/risk
5. ✅ Suggestions and recommendations displayed
6. ✅ New messages trigger new insights within 10 seconds
7. ✅ High-risk banner appears for emotional messages
8. ✅ Banner auto-dismisses after 10 seconds

## 🔍 Backend Verification (Optional)

While testing, check Terminal 2 (backend) for logs:
```
[chat:messages:post] created message <id>
[chat:messages:post] Triggering AI analysis for message <id>
[chat:ai-analysis] Starting AI analysis for message <id>
[chat:ai-analysis] Tone analysis result: { tone: 'angry', intensity: 8, ... }
[chat:ai-analysis] Risk assessment result: { risk_level: 'high', risk_score: 8, ... }
[chat:ai-analysis] ✅ Successfully stored 2 AI insights
```

## 📊 Test Messages to Try

**High Risk Messages:**
- "I'm extremely frustrated with this situation!"
- "This is absolutely ridiculous and unacceptable!"
- "I can't believe you would do this to me!"

**Medium Risk Messages:**
- "I'm feeling a bit concerned about this approach"
- "This doesn't seem quite fair to me"

**Low Risk Messages:**
- "I understand your perspective on this"
- "Can we discuss the options available?"
- "Thank you for explaining that"

## ✅ Success Criteria

Phase 4.2.2 is successful if:
- [✓] Insights appear within 10 seconds of sending message
- [✓] Polling updates sidebar automatically every 5 seconds
- [✓] High-risk alert banner shows for high-risk messages
- [✓] Alert auto-dismisses after 10 seconds
- [✓] Tone and risk badges are color-coded correctly
- [✓] Recommendations display properly
- [✓] No console errors
- [✓] UI is responsive and smooth

---

## 🎉 Ready to Test!

Open http://localhost:5174 and follow the steps above!
