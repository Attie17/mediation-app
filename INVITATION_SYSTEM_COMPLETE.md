# User Invitation System - Complete Implementation

## Overview
Complete end-to-end user invitation system allowing organization admins to invite mediators and lawyers via email. Invited users receive a secure link to create their account.

## Components Implemented

### Database Schema
**Migration:** `backend/migrations/004-create-user-invitations.sql`
- Table: `user_invitations`
- Fields:
  - `id` (serial primary key)
  - `organization_id` (foreign key to organizations)
  - `email` (varchar 255, not null)
  - `role` (varchar 50, not null - mediator/lawyer)
  - `token` (varchar 255, unique, not null)
  - `status` (enum: pending, accepted, expired, cancelled)
  - `invited_by` (integer, foreign key to app_users)
  - `message` (text, optional)
  - `expires_at` (timestamp, 7 days from creation)
  - `created_at`, `updated_at` (timestamps)
- Indexes:
  - Unique: `token`
  - Composite unique: `organization_id + email + status='pending'` (prevents duplicate pending invites)

### Backend API
**File:** `backend/src/routes/invitations.js`

#### Endpoints

1. **POST /api/organizations/:orgId/invite**
   - Create and send invitation
   - Requires: JWT auth, admin role
   - Body: `{ email, role, message? }`
   - Process:
     - Validates organization exists
     - Checks for existing pending invitation
     - Checks if user already exists
     - Generates crypto-secure token (32 bytes hex)
     - Creates invitation record
     - Sends email with invitation link
     - Logs activity
   - Response: `{ message, invitation }`

2. **GET /api/organizations/:orgId/invitations**
   - List all invitations for organization
   - Requires: JWT auth, admin role
   - Returns: Array of invitations with user details

3. **DELETE /api/invitations/:id**
   - Cancel pending invitation
   - Requires: JWT auth, admin role
   - Updates status to 'cancelled'
   - Logs activity

4. **GET /api/invitations/token/:token** (PUBLIC)
   - Get invitation details by token
   - No authentication required
   - Validates token and expiry
   - Returns: Invitation with organization branding
   - Used by acceptance page to display org info

5. **POST /api/invitations/token/:token/accept** (PUBLIC)
   - Accept invitation and create account
   - No authentication required
   - Body: `{ name, password }`
   - Process:
     - Validates invitation (exists, pending, not expired)
     - Checks if email already registered
     - Hashes password (bcrypt, 10 rounds)
     - Creates user in `app_users` table
     - Creates corresponding role record in `test_users`
     - Updates invitation status to 'accepted'
     - Logs activity
   - Response: `{ message, user }`

### Email Service
**File:** `backend/src/lib/emailService.js`

Features:
- HTML email templates with inline CSS
- Organization branding integration (logo, colors)
- Development mode: Logs emails to console
- Production mode: Sends via SMTP (configured via env vars)
- Email includes:
  - Organization logo and name
  - Invitation message from admin
  - Secure acceptance link
  - Expiry notice (7 days)
  - Role information

Environment Variables:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port (default: 587)
- `SMTP_SECURE` - Use TLS (default: false)
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `FROM_EMAIL` - Sender email address (default: noreply@mediation.app)
- `FROM_NAME` - Sender name (default: Mediation Platform)

### Frontend - Invite Modal
**File:** `frontend/src/components/admin/InviteMediatorModal.jsx`

Features:
- Email input with validation
- Role selection buttons (Mediator/Lawyer) with visual active state
- Optional personal message textarea
- Form validation:
  - Valid email format
  - Role selection required
- Loading state during submission
- Success state with auto-close (2 seconds)
- Error handling with user-friendly messages
- Info box explaining the invitation process
- Accessible keyboard navigation

UI Components:
- Modal overlay with backdrop
- Email icon and Mail icon indicators
- UserPlus icon for action button
- Loader animation during submit
- CheckCircle success indicator

### Frontend - Acceptance Page
**File:** `frontend/src/pages/AcceptInvitationPage.jsx`

Features:
- Public route at `/accept-invitation/:token`
- Organization branding display (logo, name)
- Invitation details (email, role, personal message)
- Account creation form:
  - Full name input
  - Password input (min 8 chars)
  - Confirm password input
- Validation:
  - Name required
  - Password length check
  - Password match verification
- States:
  - Loading: Fetching invitation details
  - Error: Invalid/expired token
  - Form: Account creation
  - Success: Account created, redirecting
- Auto-redirect to signin page with pre-filled email
- Responsive design with gradient background
- Icons: Building2, Mail, Lock, User, Loader, CheckCircle, AlertCircle

### Frontend - Integration
**File:** `frontend/src/routes/admin/OrganizationDetailPage.jsx`

Changes:
- Added "Invite User" button in Users tab header
- Import InviteMediatorModal component
- State: `showInviteModal`
- On successful invite: Refreshes users list
- UserPlus icon for invite button

**File:** `frontend/src/App.jsx`

Changes:
- Import AcceptInvitationPage
- Public route: `/accept-invitation/:token`
- Route placed outside HomePage nested routes for standalone access

## User Flow

### Admin Invites User
1. Admin navigates to Organization Detail page
2. Clicks "Users" tab
3. Clicks "Invite User" button (UserPlus icon)
4. Modal opens
5. Admin enters:
   - Email address
   - Role (Mediator or Lawyer)
   - Optional personal message
6. Clicks "Send Invitation"
7. Backend creates invitation record and sends email
8. Modal shows success message
9. Users list refreshes
10. Admin sees invitation in list (status: Pending)

### User Accepts Invitation
1. User receives email with invitation link
2. Clicks link (format: `http://localhost:5173/accept-invitation/{TOKEN}`)
3. Browser opens acceptance page
4. Page displays:
   - Organization logo and name
   - Invited email address
   - Role they're being invited for
   - Personal message from admin (if provided)
5. User fills in:
   - Full name
   - Password (min 8 chars)
   - Confirm password
6. Clicks "Create Account"
7. Backend:
   - Validates token and expiry
   - Creates user account
   - Hashes password
   - Updates invitation status to 'accepted'
8. Success page shows with checkmark
9. Auto-redirects to signin page after 2 seconds
10. Signin page pre-fills email address
11. User signs in with new password

### Error Handling
- **Invalid Token:** Page shows error with "Invalid Invitation" message
- **Expired Token:** API returns error, page displays expiry message
- **Already Accepted:** API returns error, suggests signing in
- **Email Already Registered:** API returns error during acceptance
- **Password Mismatch:** Frontend validation prevents submission
- **Weak Password:** Frontend requires min 8 characters
- **Network Error:** User-friendly error messages displayed

## Testing Guide

### Prerequisites
- Backend running on `localhost:4000`
- Frontend running on `localhost:5173`
- Database migrations run (including 004-create-user-invitations.sql)
- Admin account available (ceo@stabilistc.co.za / Pass@2024 or admin@dev.local)

### Test Steps

#### 1. Create Invitation
```
1. Sign in as admin
2. Navigate to Admin > Organizations
3. Click on an organization
4. Go to Users tab
5. Click "Invite User"
6. Enter test email: john.smith@example.com
7. Select role: Mediator
8. Add message: "Welcome to our mediation team!"
9. Click "Send Invitation"
10. Verify success message appears
11. Check browser console for email output (dev mode)
```

Expected console output:
```
=== EMAIL WOULD BE SENT (Development Mode) ===
To: john.smith@example.com
Subject: Invitation to join [Organization Name] on Mediation Platform
HTML Body: [Full HTML template with link]
Text Body: [Plain text version]
Invitation Link: http://localhost:5173/accept-invitation/[TOKEN]
=== END OF EMAIL ===
```

#### 2. Test Invitation Acceptance
```
1. Copy the invitation URL from console
2. Open new browser window (or incognito mode)
3. Paste invitation URL
4. Verify page loads with:
   ✓ Organization name and logo
   ✓ Email address displayed
   ✓ Role shown
   ✓ Personal message visible
5. Fill in form:
   - Name: John Smith
   - Password: TestPass123
   - Confirm: TestPass123
6. Click "Create Account"
7. Verify success message appears
8. Wait for auto-redirect to signin
9. Verify email pre-filled
10. Sign in with new password
11. Verify redirect to appropriate dashboard
```

#### 3. Verify Database Records
```sql
-- Check invitation record
SELECT id, email, role, status, expires_at 
FROM user_invitations 
WHERE email = 'john.smith@example.com';

-- Check user created
SELECT id, name, email, role 
FROM app_users 
WHERE email = 'john.smith@example.com';

-- Check test_users record
SELECT id, name, email, role, organization_id
FROM test_users 
WHERE email = 'john.smith@example.com';
```

#### 4. Test Error Scenarios

**Duplicate Invitation:**
```
1. Try inviting same email again
2. Should show error: "An invitation has already been sent to this email"
```

**Invalid Token:**
```
1. Visit /accept-invitation/invalid-token-123
2. Should show "Invalid Invitation" error page
```

**Expired Token:**
```sql
-- Manually expire invitation
UPDATE user_invitations 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE email = 'test@example.com';
```
```
1. Try to accept expired invitation
2. Should show "Invitation expired" error
```

**Already Registered:**
```
1. Create invitation for existing user email
2. Try to accept
3. Should show "Email already registered" error
```

**Password Validation:**
```
1. Try password < 8 chars → Error message
2. Passwords don't match → Error message
3. Empty name → Error message
```

#### 5. Production Email Test (Optional)
```
1. Configure SMTP in backend .env:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=noreply@yourapp.com
   FROM_NAME=Mediation Platform

2. Restart backend
3. Create invitation with real email
4. Check email inbox
5. Verify email formatting and links work
```

## Security Features

1. **Crypto-Secure Tokens:** 32-byte random tokens via `crypto.randomBytes()`
2. **Token Expiry:** 7-day automatic expiration
3. **Single Use:** Token marked 'accepted' after use, prevents reuse
4. **Password Hashing:** bcrypt with 10 rounds
5. **Email Validation:** RFC 5322 email format validation
6. **No Auth Required:** Public endpoints validate token directly
7. **Duplicate Prevention:** Database unique constraint on org+email+pending
8. **SQL Injection Protection:** Parameterized queries throughout
9. **XSS Protection:** React auto-escapes content

## Files Modified/Created

### Created
- ✅ `backend/migrations/004-create-user-invitations.sql`
- ✅ `backend/src/routes/invitations.js`
- ✅ `backend/src/lib/emailService.js`
- ✅ `frontend/src/components/admin/InviteMediatorModal.jsx`
- ✅ `frontend/src/pages/AcceptInvitationPage.jsx`

### Modified
- ✅ `backend/src/index.js` - Mounted invitations router
- ✅ `frontend/src/routes/admin/OrganizationDetailPage.jsx` - Added invite button and modal
- ✅ `frontend/src/App.jsx` - Added public invitation route

## Future Enhancements

### Potential Improvements
1. **Resend Invitation:** Allow admin to resend email for pending invitations
2. **Bulk Invite:** Upload CSV to invite multiple users at once
3. **Custom Expiry:** Allow admin to set custom expiration period
4. **Email Templates:** Admin-customizable email templates per organization
5. **Invitation Analytics:** Track acceptance rates, time to accept
6. **Reminder Emails:** Auto-send reminder before expiration
7. **Multi-Role:** Invite user with multiple roles simultaneously
8. **Conditional Fields:** Role-specific onboarding questions
9. **OAuth Integration:** Option to sign up with Google/Microsoft
10. **Audit Trail:** Detailed logging of invitation lifecycle events

### Known Limitations
1. Email delivery in dev mode only logs to console (by design)
2. No invitation preview before sending
3. Cannot edit invitation after sending
4. One invitation per email per organization at a time
5. No batch cancellation
6. Basic email template (no rich customization)

## Troubleshooting

### Invitation Email Not Appearing
- **Dev Mode:** Check backend console for email output
- **Prod Mode:** Verify SMTP credentials in .env
- **Gmail:** Use App Password, not regular password
- **Firewall:** Ensure port 587 not blocked

### Token Invalid Error
- Check invitation expiry: `SELECT expires_at FROM user_invitations WHERE token = '...'`
- Verify status is 'pending'
- Ensure token exactly matches (no extra spaces)

### Account Creation Fails
- Check if email already exists: `SELECT * FROM app_users WHERE email = '...'`
- Verify database constraints not violated
- Check backend logs for detailed error
- Ensure organization_id is valid

### User Can't Sign In After Accepting
- Verify user exists in both `app_users` and `test_users`
- Check password was hashed correctly
- Ensure role matches between tables
- Try password reset flow

### Frontend Won't Load Acceptance Page
- Verify route added to App.jsx
- Check browser console for errors
- Ensure backend API is accessible
- Verify token in URL is complete

## Success Criteria
✅ Admin can send invitations from organization detail page  
✅ Email contains secure link with organization branding  
✅ Public acceptance page loads without authentication  
✅ User can create account with validated password  
✅ Account creation adds user to both app_users and test_users  
✅ Invitation status updates to 'accepted'  
✅ User can sign in immediately after account creation  
✅ Duplicate invitations are prevented  
✅ Expired invitations are rejected  
✅ All database constraints enforced  

## Status: ✅ COMPLETE
All components implemented, integrated, and ready for testing. System provides complete end-to-end user invitation workflow from admin invitation through user account creation and first signin.
