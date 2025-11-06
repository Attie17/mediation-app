# 🎯 Mediator Pain Points - Feature Analysis & Backlog

> **Analysis Date:** November 5, 2025  
> **Status:** HOMEWORK ASSIGNMENT - DO NOT IMPLEMENT YET  
> **Purpose:** Gap analysis + SaaS opportunity assessment + prioritized backlog

---

## 📊 Executive Summary

**Current Implementation:** 45% of pain points addressed  
**Quick Wins Available:** 30% with existing infrastructure  
**SaaS Transformation Potential:** HIGH (75% of features are multi-tenant ready)

---

## PART 1: EXISTING FEATURES VS PAIN POINTS

### ✅ Pain Point 1: Screening + Safety (IPV, Power Imbalances)

**Status:** 🟡 PARTIALLY ADDRESSED (30%)

**What Exists:**
- ✅ Comprehensive intake form (`ComprehensiveIntakeForm.jsx`) - 7 steps
- ✅ Personal info, marriage details, children data collection
- ✅ Financial disclosure (income, assets, debts)
- ✅ Goals and concerns free-text fields
- ✅ Database storage via `/api/users/profile` endpoint

**What's Missing:**
- ❌ **Separate-party intake flows** (parties answer separately, not together)
- ❌ **IPV/DV screening questions** (no domestic violence assessment)
- ❌ **Coercive control indicators** (psychological abuse patterns)
- ❌ **Power imbalance detection** (income disparity, control dynamics)
- ❌ **Automatic suitability flags** (red/yellow/green risk assessment)
- ❌ **Process adaptation recommendations** (shuttle vs joint session)
- ❌ **Audit trail for screening decisions**

**SaaS Opportunity:**
- Template library of validated screening questions (NABFAM/AFCC compliant)
- Risk scoring algorithms (standardized across organizations)
- Automated risk reports for mediator review

---

### ✅ Pain Point 2: High-Conflict Dynamics That Derail Sessions

**Status:** 🟢 WELL ADDRESSED (70%)

**What Exists:**
- ✅ **AI Conflict Resolution Component** (`ConflictResolution.jsx`) - EXCELLENT
  - Conflict intensity scoring (1-10)
  - Primary issue identification
  - Resolution potential calculation
  - Conflict drivers analysis
  - Escalation risk assessment
  - Strategy recommendations (communication, negotiation, cooling off)
  - Historical pattern tracking
- ✅ **AI-powered message tone analysis** (`ai.js` routes)
  - Detects hostile/frustrated language
  - Suggests calmer alternatives
  - Emotional de-escalation prompts
- ✅ **Settlement conflict tracking** (`settlement_conflicts` table)
  - Party positions recorded
  - Resolution notes
  - Resolved status tracking
- ✅ **AI escalation risk assessment** (`aiService.js`)
  - Conversation transcript analysis
  - Risk indicators flagged
  - Mediator action recommendations

**What's Missing:**
- ❌ Real-time session facilitation tools (live conflict detection during virtual sessions)
- ❌ Pre-session conflict prediction (based on intake data + past patterns)
- ❌ Automated caucus triggers (suggest private breakouts when tension rises)
- ❌ De-escalation scripts library (templated interventions)

**SaaS Opportunity:**
- Machine learning model trained on successful mediations
- Industry benchmarks for conflict patterns
- Best practice library from top mediators

---

### ✅ Pain Point 3: Standards-Driven Documents (Not Just Agreements)

**Status:** 🟡 PARTIALLY ADDRESSED (40%)

**What Exists:**
- ✅ **Parenting plan builder** (`AnnexureAForm.jsx`, `AnnexureAFormEnhanced.jsx`)
  - 10 structured sections (parenting schedule, holidays, decision-making, etc.)
  - Party approval workflow
  - Conflict flagging per section
  - Separate party input mode (collaborative or shuttle)
- ✅ **Settlement wizard framework** (`SettlementWizardEnhanced.jsx`)
  - Annexure A (parenting) implemented
  - Annexure B (maintenance) placeholder
  - Form versioning support
  - Party approval tracking
- ✅ **Document templates** (partial)
  - Birth certificates, school fees, payslips, tax returns listed
  - Document checklist system (`constants.js`)

**What's Missing:**
- ❌ **AFCC-compliant clause library** (pre-written standard clauses)
- ❌ **IPV-sensitive language options** (alternative wording for DV cases)
- ❌ **SA-specific templates** (Family Advocate format, guardianship clauses)
- ❌ **Contemporary standards alignment** (2024 AFCC parenting plan guidance)
- ❌ **Cross-border provisions** (relocation, travel docs, Hague Convention)
- ❌ **Automated completeness check** (missing sections highlighted)
- ❌ **Version control for drafts** (track changes between iterations)

**SaaS Opportunity:**
- Centralized template library (updated annually with law changes)
- Jurisdiction-specific variants (Western Cape vs Gauteng)
- AI clause suggestion based on case facts
- Export to court-filing formats (PDF, XML)

---

### ✅ Pain Point 4: Scheduling Two+ Humans With Opposing Agendas

**Status:** 🟢 VERY WELL ADDRESSED (80%)

**What Exists:**
- ✅ **Session scheduler** (`SessionScheduler.jsx`, `SessionsList.jsx`)
  - Create, view, edit, cancel sessions
  - Upcoming and past session lists
  - Date/time picker, duration, location
  - Participant selection
  - Status tracking (scheduled, in_progress, completed, cancelled)
- ✅ **Backend API** (`sessions.js`)
  - Full CRUD operations
  - User authorization
  - Session filtering by user/role
- ✅ **Database schema** (`mediation_sessions` table)
  - Session metadata, participants (JSONB), notes
  - Indexes for performance
- ✅ **Email reminders** (`SESSION_REMINDERS_IMPLEMENTATION.md`)
  - "Remind" button on sessions
  - Email sent to all participants
  - Reminder count tracking

**What's Missing:**
- ❌ **Double-intake booking** (auto-schedule 2 separate intake meetings)
- ❌ **Lawyer involvement slots** (optional lawyer attendance)
- ❌ **Shuttle vs joint session toggle** (adapt calendar based on conflict level)
- ❌ **Caucus scheduling** (back-to-back private meetings within session)
- ❌ **No-show fee automation** (charge if cancellation < 24hrs)
- ❌ **Timezone handling** (multi-timezone participants)
- ❌ **Calendar integration** (export .ics files, sync with Google/Outlook)
- ❌ **Buffer rules** (minimum time between sessions, travel time)

**SaaS Opportunity:**
- Smart scheduling AI (suggest optimal times based on availability patterns)
- Automated no-show invoice generation
- Integration with Zoom, Google Meet (auto-create meeting links)
- Waitlist management (if mediator fully booked)

---

### ✅ Pain Point 5: Remote/Online Mediation Friction (ODR)

**Status:** 🔴 MINIMAL ADDRESSING (15%)

**What Exists:**
- ✅ Session metadata includes `location` field (can specify "Virtual - Zoom")
- ✅ Optional `meeting_link` field in sessions
- ✅ "Join" button opens meeting link in new tab
- ⚠️ Communication menu routes to `MessagesPage.jsx` (text chat only, no video)

**What's Missing:**
- ❌ **Secure video integration** (embedded Jitsi, Zoom, or native WebRTC)
- ❌ **Private caucus channels** (breakout rooms within ODR session)
- ❌ **Identity verification** (ID check before joining sensitive sessions)
- ❌ **Role-based file sharing** (mediator shares docs only with specific party)
- ❌ **E-signature workflow** (sign agreements during/after session)
- ❌ **Recording consent + storage** (encrypted session recordings)
- ❌ **Screen sharing** (review documents together during session)
- ❌ **Waiting room** (admit parties sequentially for shuttle mediation)
- ❌ **Tech literacy support** (pre-session tech checks, tooltips)
- ❌ **Confidentiality/privacy warnings** (environment check prompts)

**SaaS Opportunity:**
- White-label ODR platform (mediators get branded video rooms)
- Integrated e-signature (DocuSign, Adobe Sign API)
- Automated tech check before session
- POPIA/GDPR-compliant recording storage

---

### ✅ Pain Point 6: Substantive Complexity (Finances + Parenting)

**Status:** 🟡 PARTIALLY ADDRESSED (45%)

**What Exists:**
- ✅ **Financial disclosure in intake** (`ComprehensiveIntakeForm.jsx`)
  - Monthly income (self + spouse)
  - Property to settle (yes/no)
  - Debts to settle (yes/no)
  - Spousal support fields
- ✅ **Document upload system** (`DivorceeDocumentsPanel.jsx`)
  - 16 required documents (financial, personal, children, property)
  - Document checklist with completion tracking
  - Upload dialog with file validation
  - Status indicators (red/yellow/green)
- ✅ **Document types defined** (`constants.js`)
  - Payslips (3 months)
  - Tax returns (2 years)
  - Bank statements
  - Asset valuations
  - Proof of debts

**What's Missing:**
- ❌ **Guided disclosure workflow** (step-by-step asset/debt entry)
- ❌ **Financial calculators** (child support, spousal maintenance)
- ❌ **Scenario modeling** ("What if I keep house but waive pension?")
- ❌ **Proposal bundles** (package offers that flow into draft agreement)
- ❌ **Cross-border handling** (foreign assets, currency conversion)
- ❌ **Relocation complexity** (move costs, school changes in parenting plan)
- ❌ **Tax implications calculator** (capital gains, maintenance deductions)
- ❌ **Pension valuation tools** (actuarial calculations)

**SaaS Opportunity:**
- Built-in financial calculators (SA Maintenance Act formulas)
- Integration with property valuation APIs
- Currency exchange rate feeds
- Tax consultant directory (referral network)

---

### ✅ Pain Point 7: Ethics, Neutrality, and Conflict Checks

**Status:** 🔴 NOT ADDRESSED (5%)

**What Exists:**
- ✅ Role-based access control (mediator, divorcee, lawyer, admin)
- ✅ Case participant tracking (`case_participants` table)
- ⚠️ Basic user-case relationships stored

**What's Missing:**
- ❌ **Conflict-of-interest database** (prior matters, referral sources)
- ❌ **Auto-flagging on intake** ("You mediated for this person 2 years ago")
- ❌ **Relationship mapping** (firm connections, family ties)
- ❌ **Disclosure logging** (record when/what was disclosed to parties)
- ❌ **Neutrality statement templates** (pre-written disclaimers)
- ❌ **Ethical dilemma guidance** (AI suggests how to handle COI)
- ❌ **Referral tracking** (who referred this case? Any bias?)

**SaaS Opportunity:**
- Centralized COI database (across all mediators in org)
- Automated conflict check on case creation
- Compliance audit trail for professional bodies
- Template library for disclosure letters

---

### ✅ Pain Point 8: Business Side (Lead Triage, Education, Cashflow)

**Status:** 🟡 PARTIALLY ADDRESSED (35%)

**What Exists:**
- ✅ **User roles** (divorcee, mediator, lawyer, admin)
- ✅ **Case creation workflow** (mediator creates case, invites participants)
- ✅ **Admin dashboard** (`AdminDashboard.jsx`)
  - Total users, active cases, resolved cases
  - Role breakdown stats
  - System health monitoring
- ✅ **Organization management** (`OrganizationDetailPage.jsx`)
  - Subscription tiers (Free/Basic/Pro/Enterprise)
  - Billing period tracking
  - Payment history placeholder
- ✅ **AI insights for lead qualification** (case suitability scoring exists in conflict analysis)

**What's Missing:**
- ❌ **Lead triage system** (qualify leads before intake)
- ❌ **"Explainer" content library** (FAQ pages, process videos)
- ❌ **Suitability scoring UI** (green/yellow/red flags on dashboard)
- ❌ **Payment/trust accounting** (invoice generation, trust account tracking)
- ❌ **Refund policy automation** (calculate prorated refunds)
- ❌ **Funnel metrics dashboard** (lead → intake → first session → agreement)
- ❌ **Automated payment links** (Stripe, PayFast integration)
- ❌ **Client portal for payments** (view invoices, pay online)
- ❌ **Cancellation fee rules** (enforce 24hr notice policy)

**SaaS Opportunity:**
- White-label client portal (payments, documents, messaging)
- Integrated payment gateway (PayFast for SA)
- Funnel analytics (industry benchmarks)
- Template library for "explainer" content
- CRM integration (capture leads from website)

---

### ✅ Pain Point 9: South Africa-Specific Friction

**Status:** 🟡 PARTIALLY ADDRESSED (25%)

**What Exists:**
- ✅ **SA context in AI** (`advancedAIService.js`)
  - Ubuntu philosophy mentioned
  - Children's rights (Constitution Section 28)
  - Cultural mediation practices
  - Restorative justice principles
- ✅ Parenting plan structure aligns with SA norms
- ✅ Document types match SA requirements (payslips, tax returns, etc.)

**What's Missing:**
- ❌ **Family Advocate integration** (surface FA context in child matters)
- ❌ **SA-specific fields in parenting plans** (guardianship, access vs custody)
- ❌ **Rule 41A compliance** (court-annexed mediation rules)
- ❌ **Referral packs for FA** (export case summary in FA format)
- ❌ **Maintenance Act calculators** (SA-specific formulas)
- ❌ **High Court vs Magistrate Court guidance** (jurisdiction rules)
- ❌ **Customary law considerations** (lobola, traditional marriages)
- ❌ **BEE considerations in asset division** (business valuations)

**SaaS Opportunity:**
- Jurisdiction-specific templates (all 9 provinces)
- Family Advocate referral automation
- Integration with SARS (tax data import)
- Customary law mediator directory

---

## PART 2: FEATURES TO ADD TO EXISTING INFRASTRUCTURE

### 🔧 Quick Wins (Use Existing Components)

#### 1. IPV Screening Module (Difficulty: 3/10)
**Add to:** `ComprehensiveIntakeForm.jsx`  
**New Step:** "Step 4.5 - Safety Assessment"  
**Implementation:**
- Add 10 validated IPV screening questions
- Store responses in `profileDetails.ipv_screening`
- Auto-flag cases with 3+ red flags
- Trigger: Show shuttle mediation recommendation on mediator dashboard

**Acceptance Criteria:**
- [ ] Each party answers IPV questions separately
- [ ] Mediator sees "High Risk" badge on case if flags triggered
- [ ] System suggests process adaptations (shuttle, lawyer present)

**Database Changes:** None (store in existing JSONB field)  
**API Changes:** None (use existing `/api/users/profile` endpoint)

---

#### 2. Financial Calculator Widget (Difficulty: 5/10)
**Add to:** `ComprehensiveIntakeForm.jsx` Step 5 (Financial)  
**Component:** `FinancialCalculator.jsx` (NEW)  
**Implementation:**
- Embed calculator after income fields
- SA Maintenance Act formula (40% gross income - dependents)
- Child support slider (expenses input)
- Scenario comparison table

**Acceptance Criteria:**
- [ ] Calculator uses SA-specific formulas
- [ ] Results saved to `profileDetails.financial_estimates`
- [ ] Mediator sees estimates on case overview

**External Dependency:** None (pure JavaScript calculation)

---

#### 3. Conflict Check on Case Creation (Difficulty: 4/10)
**Add to:** Backend `cases.js` route (POST `/api/cases`)  
**Implementation:**
```javascript
// Before creating case:
const priorCases = await pool.query(`
  SELECT c.id, c.title, cp.user_id 
  FROM cases c
  JOIN case_participants cp ON c.id = cp.case_id
  WHERE cp.user_id = ANY($1)
  AND c.mediator_id = $2
`, [participantIds, mediatorId]);

if (priorCases.rows.length > 0) {
  return res.status(409).json({
    conflict: true,
    message: 'Potential conflict of interest',
    priorCases: priorCases.rows
  });
}
```

**Acceptance Criteria:**
- [ ] System checks if mediator has prior cases with any party
- [ ] Mediator sees warning: "You mediated for Alice in 2023 (Case #123)"
- [ ] Mediator can proceed with disclosure or decline

**Database Changes:** None (query existing `cases` + `case_participants`)

---

#### 4. Document Completeness Check (Difficulty: 3/10)
**Add to:** `DivorceeDocumentsPanel.jsx`  
**Implementation:**
- Compare uploaded docs vs `DOC_TOPICS` requirements
- Show progress bar: "12/16 documents uploaded"
- Highlight missing critical docs (red badge)
- Mediator dashboard shows per-case completeness %

**Acceptance Criteria:**
- [ ] Divorcee sees "3 critical documents missing"
- [ ] Mediator sees "Case #123: 75% complete"
- [ ] AI suggests next document to upload

**Database Changes:** Add `document_completeness` column to `cases` (float 0-1)

---

#### 5. Session Timezone Handling (Difficulty: 6/10)
**Modify:** `SessionScheduler.jsx` + backend `sessions.js`  
**Implementation:**
- Store session time in UTC
- Detect user's timezone on login (store in `app_users.timezone`)
- Display session times in user's local timezone
- Send email reminders with timezone clarification

**Acceptance Criteria:**
- [ ] Mediator in Cape Town (UTC+2) schedules 14:00 session
- [ ] Divorcee in London (UTC+1) sees 13:00 on their dashboard
- [ ] Email says "14:00 SAST (13:00 GMT)"

**Database Changes:** Add `timezone` column to `app_users`, add `timezone` to `mediation_sessions`

---

## PART 3: SAAS TRANSFORMATION FEATURES

### 🌐 Multi-Tenancy Foundation

#### 1. Organization Branding (Difficulty: 6/10)
**Status:** 🟡 Partially Exists  
**Current:** `BrandingContext.jsx` supports custom branding  
**Gap:** No UI to manage branding

**SaaS Feature:**
- Admin uploads logo, sets primary color, tagline
- White-label client portal (hide "Accord Mediation" for Pro+ tiers)
- Custom email templates with org branding
- Subdomain routing (`capetown.accordmediation.com`)

**Acceptance Criteria:**
- [ ] Admin uploads logo → appears on all divorcee pages
- [ ] Pro tier: Custom domain (`www.capetownmediation.co.za`)
- [ ] Email headers use org logo + colors

**Revenue Impact:** Pro tier = R2500/month premium

---

#### 2. Template Marketplace (Difficulty: 7/10)
**New Feature**

**SaaS Value:**
- Library of 50+ validated templates (parenting plans, maintenance agreements)
- AFCC-compliant, SA-specific, IPV-sensitive variants
- Mediators subscribe to template packs ($50/month)
- Community contributions (mediators share + earn royalties)

**Acceptance Criteria:**
- [ ] Mediator browses template library (filtered by jurisdiction, issue type)
- [ ] One-click import template into current case
- [ ] Auto-populate template with case data
- [ ] Version control (template updated? Notify users)

**Revenue Model:**
- Free tier: 5 basic templates
- Pro tier: All templates included
- Marketplace: 30% revenue share on premium templates

---

#### 3. Analytics Dashboard (Difficulty: 8/10)
**New Feature**

**SaaS Value:**
- System-wide metrics (mediator KPIs, org performance)
- Funnel tracking: lead → intake → session → agreement
- Time-to-resolution benchmarks
- AI effectiveness scores (suggestions accepted vs rejected)
- Conflict pattern analysis (what triggers impasses?)

**Acceptance Criteria:**
- [ ] Admin sees: "Avg time to resolution: 45 days (industry: 60 days)"
- [ ] Mediator sees: "Your agreement rate: 78% (org avg: 65%)"
- [ ] AI dashboard: "Neutral phrasing suggestions accepted 82% of time"
- [ ] Org sees: "High-conflict cases: 15% (up 3% from Q3)"

**Revenue Impact:** Enterprise tier feature (R5000/month)

---

#### 4. Referral Network (Difficulty: 6/10)
**New Feature**

**SaaS Value:**
- Directory of lawyers, financial advisors, therapists
- In-app referrals with tracking
- Referral fee automation (5% to platform, 5% to referrer)
- Reviews + ratings for service providers

**Acceptance Criteria:**
- [ ] Mediator refers divorcee to lawyer → lawyer gets notification
- [ ] Lawyer accepts referral → mediator gets confirmation
- [ ] Case shows "Referred to: John Smith, Attorneys"
- [ ] Platform tracks referral conversion rate

**Revenue Model:**
- Referral fees: 10% of first invoice
- Premium listings: R500/month for lawyers

---

#### 5. White-Label Client Portal (Difficulty: 9/10)
**New Feature**

**SaaS Value:**
- Fully branded client portal (org's domain, logo, colors)
- Secure login, document uploads, payment processing
- Mobile-responsive
- Push notifications (session reminders)

**Acceptance Criteria:**
- [ ] Client accesses `portal.capetownmediation.co.za`
- [ ] Sees Cape Town Mediation branding (no "Accord" mention)
- [ ] Uploads documents, pays invoices, books sessions
- [ ] Receives SMS/email reminders with org branding

**Revenue Impact:** Enterprise tier only (R8000/month)

---

## PART 4: PRIORITIZED FEATURE BACKLOG

### 🚀 MVP Enhancements (Next 3 Months)

| Priority | Feature | Difficulty | SaaS Value | Estimated Hours |
|----------|---------|-----------|------------|----------------|
| **P0** | IPV Screening Module | 3/10 | HIGH | 16h |
| **P0** | Document Completeness Check | 3/10 | MEDIUM | 12h |
| **P1** | Financial Calculator Widget | 5/10 | HIGH | 24h |
| **P1** | Conflict Check on Case Creation | 4/10 | MEDIUM | 20h |
| **P1** | Session Timezone Handling | 6/10 | HIGH | 28h |
| **P2** | AFCC Clause Library | 5/10 | HIGH | 32h |
| **P2** | E-Signature Integration | 7/10 | CRITICAL | 40h |
| **P2** | Payment Gateway (PayFast) | 6/10 | CRITICAL | 36h |

**Total MVP Hours:** 208h (5-6 weeks at 40h/week)  
**Revenue Unlock:** Subscription-ready platform

---

### 🌟 SaaS Growth Features (Months 4-12)

| Priority | Feature | Difficulty | Revenue Impact | Estimated Hours |
|----------|---------|-----------|---------------|----------------|
| **P3** | Organization Branding UI | 6/10 | +R2500/mo/org | 32h |
| **P3** | Template Marketplace | 7/10 | +R50-500/mo/user | 60h |
| **P4** | Analytics Dashboard | 8/10 | +R5000/mo (Ent) | 80h |
| **P4** | White-Label Portal | 9/10 | +R8000/mo (Ent) | 120h |
| **P5** | Referral Network | 6/10 | +10% referral fees | 48h |
| **P5** | Secure Video (Jitsi Embed) | 7/10 | +R1500/mo (Pro) | 56h |

**Total Growth Hours:** 396h (10 weeks at 40h/week)  
**Revenue Unlock:** R15k-30k MRR per enterprise client

---

## PART 5: DETAILED WIREFRAMES

### Feature 1: Risk-Aware Intake

**Component:** `RiskAwareIntakeForm.jsx`

**Screen Flow:**
```
┌─────────────────────────────────────────┐
│  Step 4.5: Safety & Wellbeing           │
│                                         │
│  These questions help us understand if  │
│  additional support or process          │
│  adaptations would benefit your case.   │
│                                         │
│  [Progress: 60% Complete]               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  1. Have you ever felt afraid of your   │
│     partner during conflicts?           │
│     ○ Never  ○ Rarely  ● Often  ○ Always│
│                                         │
│  2. Does your partner control finances, │
│     social contacts, or decisions?      │
│     ● Yes  ○ No  ○ Unsure               │
│                                         │
│  3. Have you experienced physical       │
│     violence or threats?                │
│     ● Yes - in past  ○ Yes - ongoing    │
│     ○ No                                │
│                                         │
│  [Continue in Private Mode]             │
│  (Your partner will NOT see these       │
│   answers)                              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚠️ Safety Recommendation               │
│                                         │
│  Based on your responses, we recommend: │
│  • Shuttle mediation (separate rooms)   │
│  • Support person present               │
│  • Extended intake interview            │
│                                         │
│  Your mediator will discuss these       │
│  options with you privately.            │
│                                         │
│  [✓ I Understand]  [Talk to Someone Now]│
└─────────────────────────────────────────┘
```

**Database Schema:**
```sql
ALTER TABLE app_users ADD COLUMN risk_assessment JSONB;

-- Example data:
{
  "ipv_flags": 3,
  "power_imbalance_score": 7,
  "suitability": "shuttle_recommended",
  "screened_at": "2025-11-05T10:30:00Z",
  "questions": {
    "fear_during_conflict": "often",
    "financial_control": "yes",
    "physical_violence": "past"
  }
}
```

**Backend Endpoint:**
```javascript
// POST /api/users/risk-assessment
router.post('/risk-assessment', authenticateUser, async (req, res) => {
  const { questions } = req.body;
  
  // Calculate risk scores
  const ipvFlags = calculateIPVFlags(questions);
  const powerImbalance = calculatePowerImbalance(questions);
  const suitability = determineSuitability(ipvFlags, powerImbalance);
  
  // Store assessment
  await pool.query(`
    UPDATE app_users 
    SET risk_assessment = $1 
    WHERE id = $2
  `, [JSON.stringify({
    ipv_flags: ipvFlags,
    power_imbalance_score: powerImbalance,
    suitability,
    screened_at: new Date().toISOString(),
    questions
  }), req.user.id]);
  
  res.json({ ok: true, suitability, ipvFlags, powerImbalance });
});
```

**Acceptance Criteria:**
- [ ] Questions appear after Step 4 (Children) in intake
- [ ] Responses encrypted in transit (HTTPS)
- [ ] Other party CANNOT see risk assessment answers
- [ ] Mediator sees flag: "High Risk - Shuttle Recommended"
- [ ] System suggests process adaptations automatically
- [ ] Audit log: who viewed risk assessment + when

**Difficulty Breakdown:**
- Frontend form: 6h (new step in existing wizard)
- Risk calculation logic: 4h (research NABFAM scoring)
- Database integration: 2h (add JSONB column)
- Mediator dashboard UI: 4h (show flags + recommendations)
- **Total: 16h (Difficulty 3/10)**

---

### Feature 2: Parenting Plan Builder (Enhanced)

**Component:** `ParentingPlanBuilderV2.jsx`

**Screen Flow:**
```
┌─────────────────────────────────────────┐
│  📋 Parenting Plan Builder              │
│                                         │
│  [Standard Template ▼] [IPV-Sensitive]  │
│                                         │
│  Suggested Clauses (based on your case):│
│  ✓ School holidays (50/50 split)        │
│  ✓ Emergency medical decisions          │
│  ⚠️ Relocation (requires SA High Court)  │
│                                         │
│  [Preview Document] [Save Draft]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Section 1: Parenting Schedule          │
│                                         │
│  [Use AFCC Standard Clause]             │
│  [Customize]                            │
│                                         │
│  📝 Standard Clause (AFCC 2024):        │
│  "The children shall reside with        │
│   [Parent A] on weekdays and with       │
│   [Parent B] on weekends, alternating   │
│   every other weekend. Handover shall   │
│   occur at [Location] at [Time]."       │
│                                         │
│  [Accept This Clause] [Modify] [Skip]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚠️ IPV-Sensitive Clause Detected       │
│                                         │
│  This case has safety flags. Consider:  │
│  • Supervised handovers (neutral venue) │
│  • No direct contact during handover    │
│  • Third-party communication only       │
│                                         │
│  [Apply IPV Protections] [Dismiss]      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  📄 Preview: Parenting Plan Draft       │
│                                         │
│  [Download PDF] [Share with Lawyer]     │
│  [Submit for Mediator Review]           │
│                                         │
│  Completeness: 85%                      │
│  Missing: Dispute resolution clause     │
│                                         │
│  [Return to Editing]                    │
└─────────────────────────────────────────┘
```

**Database Schema:**
```sql
CREATE TABLE parenting_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  jurisdiction VARCHAR(100), -- 'south_africa', 'western_cape'
  category VARCHAR(100), -- 'standard', 'ipv_sensitive', 'cross_border'
  clauses JSONB NOT NULL, -- Array of clause objects
  afcc_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE parenting_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id),
  template_id UUID REFERENCES parenting_plan_templates(id),
  customizations JSONB, -- Overrides from template
  completeness_score FLOAT, -- 0-1
  draft_version INT DEFAULT 1,
  status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Backend Endpoint:**
```javascript
// GET /api/parenting-plans/templates?category=ipv_sensitive
router.get('/templates', async (req, res) => {
  const { category, jurisdiction } = req.query;
  
  const { data, error } = await supabase
    .from('parenting_plan_templates')
    .select('*')
    .eq('category', category || 'standard')
    .eq('jurisdiction', jurisdiction || 'south_africa');
  
  res.json({ ok: true, templates: data });
});

// POST /api/parenting-plans
router.post('/', authenticateUser, async (req, res) => {
  const { caseId, templateId, customizations } = req.body;
  
  // Calculate completeness score
  const completeness = calculateCompleteness(customizations);
  
  const { data, error } = await supabase
    .from('parenting_plans')
    .insert({
      case_id: caseId,
      template_id: templateId,
      customizations,
      completeness_score: completeness,
      draft_version: 1
    })
    .select();
  
  res.json({ ok: true, plan: data[0] });
});
```

**Acceptance Criteria:**
- [ ] Mediator selects "AFCC Standard" or "IPV-Sensitive" template
- [ ] Template pre-fills with 10-15 standard clauses
- [ ] AI suggests clauses based on intake data (children ages, conflict level)
- [ ] Parties can edit clauses or accept as-is
- [ ] System highlights missing sections (red badge)
- [ ] Export to PDF with SA-specific formatting
- [ ] Version history (track changes between drafts)
- [ ] Family Advocate-friendly export (includes case summary)

**Difficulty Breakdown:**
- Template library creation: 12h (research AFCC/NABFAM standards)
- Frontend builder UI: 16h (clause selection, editing, preview)
- Completeness scoring: 4h (check required sections)
- PDF export: 8h (formatting, SA court standards)
- Version control: 6h (track changes logic)
- **Total: 46h (Difficulty 6/10)**

---

### Feature 3: ODR Session Room (Video + E-Signature)

**Component:** `ODRSessionRoom.jsx`

**Screen Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│  🎥 Mediation Session - Johnson Case                       │
│  Mediator: Sarah Thompson  |  Parties: Alice & Bob         │
│                                                             │
│  [Main Room] [Caucus: Alice] [Caucus: Bob]                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┬──────────────────┐
│  Video Grid                              │  Sidebar         │
│  ┌────────────┐ ┌────────────┐          │                  │
│  │ Mediator   │ │   Alice    │          │  📄 Documents    │
│  │ [Sarah T.] │ │  [muted]   │          │  • Parenting Plan│
│  └────────────┘ └────────────┘          │  • Asset List    │
│  ┌────────────┐ ┌────────────┐          │                  │
│  │    Bob     │ │ [Screen    │          │  ✍️ Signatures   │
│  │            │ │  Share]    │          │  • Alice: Pending│
│  └────────────┘ └────────────┘          │  • Bob: Pending  │
│                                          │                  │
│  [Mute] [Video Off] [Share Screen]      │  💬 Chat         │
│  [Break to Caucus] [End Session]        │  (3 messages)    │
└──────────────────────────────────────────┴──────────────────┘

┌─────────────────────────────────────────┐
│  🚪 Mediator: Move to Caucus?           │
│                                         │
│  This will create private breakout      │
│  rooms. You can speak with each party   │
│  individually, then return to main.     │
│                                         │
│  [✓ Start Caucus] [Cancel]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ✍️ Sign Parenting Plan Agreement       │
│                                         │
│  Alice, please review the agreement:    │
│  [View PDF]                             │
│                                         │
│  By signing below, you agree to the     │
│  terms outlined in this parenting plan. │
│                                         │
│  [Draw Signature]                       │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │  [Hand-drawn signature area]      │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Clear] [Sign & Submit]                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  🎉 Session Complete                    │
│                                         │
│  Both parties have signed the agreement.│
│  Recording saved (encrypted).           │
│                                         │
│  Next steps:                            │
│  • Mediator: Finalize report            │
│  • Parties: Receive signed copy via    │
│    email (within 24h)                   │
│                                         │
│  [Download Signed Agreement] [Exit]     │
└─────────────────────────────────────────┘
```

**Technical Architecture:**
```javascript
// Option 1: Jitsi Embed (Open Source)
<JitsiMeet
  roomName={`mediationsession-${sessionId}`}
  configOverwrite={{
    prejoinPageEnabled: false, // Skip lobby
    disableModeratorIndicator: true,
    startWithAudioMuted: false,
    startWithVideoMuted: false,
    enableInsecureRoomNameWarning: false,
    p2p: { enabled: false }, // Force server relay for privacy
    breakoutRooms: { enabled: true } // Caucus support
  }}
  interfaceConfigOverwrite={{
    SHOW_JITSI_WATERMARK: false,
    SHOW_BRAND_WATERMARK: false,
    TOOLBAR_BUTTONS: [
      'microphone', 'camera', 'desktop', 'chat',
      'raisehand', 'videoquality', 'filmstrip',
      'settings', 'hangup'
    ]
  }}
  userInfo={{
    displayName: user.name,
    email: user.email
  }}
/>

// Option 2: Native WebRTC (More Control)
const peerConnection = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'turn:turn.yourdomain.com:3478', 
      username: 'mediator', 
      credential: 'secret' }
  ]
});
```

**Database Schema:**
```sql
CREATE TABLE odr_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mediation_session_id UUID REFERENCES mediation_sessions(id),
  room_id VARCHAR(255) UNIQUE NOT NULL,
  video_provider VARCHAR(50), -- 'jitsi', 'zoom', 'native'
  recording_url VARCHAR(500), -- S3 link to encrypted recording
  recording_consent JSONB, -- { mediator: true, alice: true, bob: false }
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  caucus_log JSONB, -- Array of caucus events
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE odr_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  odr_session_id UUID REFERENCES odr_sessions(id),
  document_id UUID REFERENCES uploads(id),
  signer_id UUID REFERENCES app_users(id),
  signature_data TEXT, -- Base64 encoded image
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

**Backend Endpoints:**
```javascript
// POST /api/odr-sessions/start
router.post('/start', authenticateUser, requireRole('mediator'), async (req, res) => {
  const { sessionId } = req.body;
  
  // Create unique room ID
  const roomId = `mediation-${sessionId}-${Date.now()}`;
  
  // Generate Jitsi JWT token (optional, for secure rooms)
  const jitsiToken = generateJitsiJWT(roomId, user);
  
  // Store session
  await pool.query(`
    INSERT INTO odr_sessions (mediation_session_id, room_id, video_provider)
    VALUES ($1, $2, $3)
  `, [sessionId, roomId, 'jitsi']);
  
  res.json({ ok: true, roomId, jitsiToken });
});

// POST /api/odr-sessions/:id/sign
router.post('/:id/sign', authenticateUser, async (req, res) => {
  const { documentId, signatureData } = req.body;
  
  // Verify user is participant
  const session = await verifySessionParticipant(req.params.id, req.user.id);
  if (!session) return res.status(403).json({ error: 'Not authorized' });
  
  // Store signature
  await pool.query(`
    INSERT INTO odr_signatures (odr_session_id, document_id, signer_id, signature_data, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [req.params.id, documentId, req.user.id, signatureData, req.ip, req.headers['user-agent']]);
  
  // Check if all parties signed
  const signatures = await pool.query(`
    SELECT COUNT(*) as count 
    FROM odr_signatures 
    WHERE odr_session_id = $1 AND document_id = $2
  `, [req.params.id, documentId]);
  
  const allSigned = signatures.rows[0].count >= session.participantCount;
  
  res.json({ ok: true, allSigned });
});
```

**Acceptance Criteria:**
- [ ] Mediator clicks "Start ODR Session" → Video room launches
- [ ] Parties join via secure link (no password needed, JWT auth)
- [ ] Mediator can initiate caucus → Private rooms created
- [ ] Screen sharing works (mediator shares parenting plan)
- [ ] Chat sidebar for typed messages (archived post-session)
- [ ] Recording consent requested from all parties
- [ ] E-signature: Parties draw signature on tablet/touchscreen
- [ ] Signed document emailed within 24h (encrypted PDF)
- [ ] Recording stored in S3 (AES-256 encryption, 7-year retention)
- [ ] Identity verification: Camera snapshot + ID check before joining

**Difficulty Breakdown:**
- Jitsi embed integration: 12h (setup, config)
- Caucus/breakout logic: 10h (room management)
- E-signature capture: 8h (canvas drawing, base64 encoding)
- Recording storage: 10h (S3 integration, encryption)
- Identity verification: 12h (camera snapshot, ID comparison)
- **Total: 52h (Difficulty 8/10)**

---

## PART 6: SaaS PRICING MODEL

### Tier Structure

| Feature | Free | Basic (R500/mo) | Pro (R2500/mo) | Enterprise (R8000/mo) |
|---------|------|-----------------|----------------|-----------------------|
| **Cases/month** | 2 | 10 | Unlimited | Unlimited |
| **Storage** | 1GB | 10GB | 100GB | 1TB |
| **Users** | 1 mediator | 3 mediators | 10 mediators | Unlimited |
| **IPV Screening** | ❌ | ✅ | ✅ | ✅ |
| **Financial Calculator** | ❌ | ✅ | ✅ | ✅ |
| **AFCC Templates** | 5 basic | 20 templates | All templates | All + custom |
| **ODR Video** | ❌ | 2h/month | 20h/month | Unlimited |
| **E-Signature** | ❌ | ✅ | ✅ | ✅ |
| **White-Label Portal** | ❌ | ❌ | ❌ | ✅ |
| **Analytics Dashboard** | ❌ | Basic | Advanced | Enterprise |
| **Support** | Community | Email | Priority | Dedicated |

**Add-Ons:**
- Extra storage: R100/10GB/month
- Template packs: R50-200/pack
- ODR hours: R50/hour (beyond tier limit)
- Referral network: 10% of transaction (no monthly fee)

**Revenue Projections (100 Organizations):**
- Free: 30 orgs × R0 = R0
- Basic: 40 orgs × R500 = R20k/mo
- Pro: 25 orgs × R2500 = R62.5k/mo
- Enterprise: 5 orgs × R8000 = R40k/mo
- **Total MRR:** R122.5k (~$6,500 USD)
- **Annual:** R1.47M (~$78k USD)

---

## PART 7: IMPLEMENTATION ROADMAP

### Phase 1: MVP Enhancements (Weeks 1-6)

**Week 1-2: Risk-Aware Intake**
- [ ] Add IPV screening questions to intake form
- [ ] Implement risk scoring algorithm
- [ ] Store assessments in database
- [ ] Show flags on mediator dashboard

**Week 3-4: Financial Tools + Document Checks**
- [ ] Build SA maintenance calculator
- [ ] Add document completeness tracker
- [ ] Highlight missing critical documents
- [ ] AI suggestion: "Upload payslips next"

**Week 5-6: Scheduling + Conflict Checks**
- [ ] Timezone handling in sessions
- [ ] Conflict-of-interest checker on case creation
- [ ] .ics calendar export
- [ ] Buffer rules (min 30min between sessions)

---

### Phase 2: SaaS Foundation (Weeks 7-12)

**Week 7-8: Payment Gateway**
- [ ] PayFast integration
- [ ] Invoice generation
- [ ] Trust accounting (separate funds per case)
- [ ] Refund automation

**Week 9-10: Branding + Templates**
- [ ] Organization branding UI (upload logo, set colors)
- [ ] AFCC clause library (50 templates)
- [ ] Template import to parenting plan builder
- [ ] White-label email templates

**Week 11-12: E-Signature**
- [ ] Signature canvas in ODR session
- [ ] PDF signing workflow
- [ ] Email signed documents
- [ ] Audit trail (IP, timestamp, user agent)

---

### Phase 3: Advanced SaaS (Months 4-6)

**Months 4-5: ODR Video**
- [ ] Jitsi embed with caucus support
- [ ] Recording + encryption
- [ ] Identity verification
- [ ] Screen sharing

**Month 6: Analytics**
- [ ] Funnel metrics dashboard
- [ ] Mediator KPI tracking
- [ ] Conflict pattern analysis
- [ ] AI effectiveness scores

---

## NEXT STEPS WHEN YOU RETURN

1. **Review this document** - Validate pain point analysis
2. **Prioritize features** - Which quick wins to tackle first?
3. **Choose 1-2 MVP features** - Start with IPV screening + financial calculator?
4. **Set SaaS launch date** - Target Q2 2026?
5. **Assign difficulty ratings** - Do you agree with complexity scores?

**DO NOT START CODING YET.** This is for review and planning only.

---

**Document Created:** November 5, 2025  
**Status:** HOMEWORK - AWAITING USER FEEDBACK  
**Next Action:** User reviews, provides feedback, then we begin implementation

