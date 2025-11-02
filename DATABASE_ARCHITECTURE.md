# Database Architecture Overview

## Organization Structure

```
┌─────────────────────┐
│   ORGANIZATIONS     │ ← Each mediator practice (tenant)
│  - id               │
│  - name             │
│  - subscription_tier│
└──────┬──────────────┘
       │
       │ (organization_id FK)
       │
       ├──────────────────────────────────────┬────────────────────────────────┐
       │                                      │                                │
       ▼                                      ▼                                ▼
┌─────────────┐                      ┌─────────────┐                  ┌─────────────┐
│  APP_USERS  │                      │    CASES    │                  │   UPLOADS   │
│  - user_id  │                      │  - id       │                  │  - id       │
│  - role     │                      │  - title    │                  │  - file     │
│  - org_id   │──────────┐           │  - org_id   │                  │  - org_id   │
└─────────────┘          │           └──────┬──────┘                  └─────────────┘
                         │                  │
                         │                  │
                         │                  │
                         │           ┌──────▼──────────────┐
                         │           │ CASE_ASSIGNMENTS    │ ← Links cases to mediators
                         │           │  - case_id          │
                         └──────────→│  - mediator_id      │
                                     │  - organization_id  │
                                     │  - assigned_by      │
                                     │  - status           │
                                     └─────────────────────┘
```

## How It Works

### 1. **Organizations** (Tenants)
- Each mediator practice is an organization
- Has subscription tiers: trial, basic, pro, enterprise
- Has limits: max_active_cases, max_mediators, storage_limit_mb

### 2. **Users → Organizations** (Direct Link)
```sql
app_users.organization_id → organizations.id
```
- **ALL users** can belong to an organization directly
- **Mediators**: `role='mediator'` + `organization_id` = their practice
- **Admins**: `role='admin'` + optional `organization_id`
- **Divorcees**: `role='divorcee'` + optional `organization_id`

### 3. **Cases → Organizations** (Direct Link)
```sql
cases.organization_id → organizations.id
```
- Each case belongs to one organization
- All case data (participants, messages, uploads) inherits organization

### 4. **Case Assignments** (Mediator ↔ Case Link)
```sql
case_assignments {
  case_id → cases.id
  mediator_id → app_users.user_id (where role='mediator')
  organization_id → organizations.id
}
```

## Your Question: How Do Divorcees Link to Mediators & Organizations?

**Answer:** Through the **case_assignments** table!

### The Flow:
1. **Admin** creates a case → case gets `organization_id`
2. **Admin** assigns case to a **mediator** → creates `case_assignment` record
3. **Admin** adds **divorcee** participants to the case → divorcees become part of that case
4. **Result:** Divorcees are linked to:
   - The **case** (via case_participants or direct case access)
   - The **mediator** (via case_assignments.mediator_id for that case)
   - The **organization** (via cases.organization_id)

### Example Data Flow:
```sql
-- Organization: "Smith Mediation Services"
organizations: { id: 'org-123', name: 'Smith Mediation Services' }

-- Mediator: John Smith works at this organization
app_users: { user_id: 'mediator-456', role: 'mediator', organization_id: 'org-123' }

-- Case: Divorce case for Bob and Alice
cases: { id: 'case-789', title: 'Smith v Smith', organization_id: 'org-123' }

-- Assignment: John Smith assigned to this case
case_assignments: {
  case_id: 'case-789',
  mediator_id: 'mediator-456',
  organization_id: 'org-123'
}

-- Divorcees: Bob and Alice
app_users: { user_id: 'bob-111', role: 'divorcee', organization_id: NULL }
app_users: { user_id: 'alice-222', role: 'divorcee', organization_id: NULL }

-- Participants: Bob and Alice are participants in the case
case_participants: { case_id: 'case-789', user_id: 'bob-111', role: 'divorcee' }
case_participants: { case_id: 'case-789', user_id: 'alice-222', role: 'divorcee' }
```

### Stats & Reporting:
When you view an organization's stats, it counts:
- **Cases**: All cases where `cases.organization_id = org-123`
- **Active Mediators**: All users where `role='mediator'` AND `organization_id = org-123`
- **Divorcees**: All participants in cases belonging to this org (through case_participants → cases → organization_id)

## Summary

**There IS a linking table:** `case_assignments`

**The relationship chain:**
```
Divorcee → Case (via case_participants)
  ↓
Case → Organization (via cases.organization_id)
Case → Mediator (via case_assignments.mediator_id)
  ↓
Mediator → Organization (via app_users.organization_id)
```

**Therefore:**
- Divorcees don't need `organization_id` in their user record
- They get linked to organizations through the cases they participate in
- When admin assigns a case to a mediator, the case becomes part of that organization's stats
- The divorcees in that case automatically contribute to the organization's metrics
