# Pre-Flight Checklist

Complete this checklist before each production deployment to ensure system readiness.

## Pre-Deployment Phase

### Code Quality
- [ ] All tests passing (`npm test` in backend and frontend)
- [ ] No console.log statements in production code
- [ ] All TODOs and FIXMEs resolved
- [ ] Code linted and formatted
- [ ] No hardcoded credentials or secrets
- [ ] Git status clean (all changes committed)
- [ ] Latest changes merged to main/master branch

### Dependencies
- [ ] `npm audit` shows no vulnerabilities (backend)
- [ ] `npm audit` shows no vulnerabilities (frontend)
- [ ] All dependencies up to date
- [ ] No unused dependencies in package.json
- [ ] Production dependencies separated from dev dependencies

### Environment Variables
- [ ] `.env.production` file reviewed
- [ ] All required variables listed in `.env.example`
- [ ] New JWT_SECRET generated (32+ bytes)
- [ ] New SESSION_SECRET generated (32+ bytes)
- [ ] CORS_ORIGIN set to production frontend URL
- [ ] SendGrid API key valid and tested
- [ ] Cloudinary credentials verified
- [ ] Database URL configured (Railway provides)

### Database
- [ ] All migrations tested locally
- [ ] Migration runbook documented
- [ ] Backup of current production data (if applicable)
- [ ] Indexes verified after performance optimization migration
- [ ] No direct database modifications planned outside migrations

### Security
- [ ] Helmet security headers configured
- [ ] Rate limiting enabled for all critical routes
- [ ] Input validation on all user inputs
- [ ] HTTPS enforced (Railway default)
- [ ] Authentication tokens using secure secrets
- [ ] Password hashing using bcrypt
- [ ] SQL injection protection verified (parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF protection if needed

### Frontend Build
- [ ] `npm run build` successful
- [ ] Build output in `frontend/dist/`
- [ ] No build warnings or errors
- [ ] API_BASE_URL pointing to production backend
- [ ] Source maps disabled in production
- [ ] Asset optimization enabled (minification, compression)

### Backend Configuration
- [ ] `NODE_ENV=production` set
- [ ] Winston logging configured
- [ ] Error handler middleware last in chain
- [ ] 404 handler configured
- [ ] Request logger active
- [ ] Health check endpoint `/healthz` responding

---

## Deployment Phase

### Railway Setup
- [ ] Railway CLI installed and authenticated
- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Backend service configured
- [ ] Frontend service configured
- [ ] Custom domain configured (if applicable)

### Environment Variables (Railway)
- [ ] Backend service: All variables from `.env.production` set
- [ ] Frontend service: All VITE_ variables set
- [ ] DATABASE_URL automatically set by Railway PostgreSQL
- [ ] Secrets verified (no "CHANGE_ME" placeholders)

### Deployment
- [ ] Backend deployed: `railway up` (in backend folder)
- [ ] Frontend deployed: `railway up` (in frontend folder)
- [ ] Build logs reviewed for errors
- [ ] Deployment successful (green status)

### Database Migrations
- [ ] Base schema applied (`run-migration.js` / `001-create-organizations-schema.sql`)
- [ ] Backfill scripts executed (`migrations/002-backfill-organizations.js`, others as required)
- [ ] Latest SQL migrations applied (check `backend/migrations/` for new files)
- [ ] Performance index script executed (`migrations/005-add-performance-indexes.js`)
- [ ] Database schema verified via Railway console

---

## Post-Deployment Phase

### Health Checks
- [ ] Backend `/healthz` endpoint returns 200 OK
- [ ] Database connection status "connected"
- [ ] Frontend loads without errors
- [ ] API calls successful from frontend

### Functional Testing
- [ ] User registration working
- [ ] User login working
- [ ] Password reset working (if implemented)
- [ ] JWT token refresh working
- [ ] Organization creation working (admin)
- [ ] User invitations sending
- [ ] Case creation working
- [ ] File uploads working (Cloudinary)
- [ ] Email notifications sending (SendGrid)

### Security Testing
- [ ] Rate limiting blocking excessive requests
- [ ] CORS blocking unauthorized origins
- [ ] Invalid input rejected with 400 errors
- [ ] Unauthorized requests blocked with 401
- [ ] Forbidden requests blocked with 403
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized

### Performance Testing
- [ ] API response times < 200ms (average)
- [ ] Database queries using indexes (check logs)
- [ ] Frontend load time < 3 seconds
- [ ] No memory leaks (monitor Railway metrics)
- [ ] No excessive logging (info level in production)

### Monitoring Setup
- [ ] Railway health checks configured
- [ ] Sentry error tracking active (if configured)
- [ ] Winston logs accessible via Railway
- [ ] Alert rules configured for critical errors
- [ ] Uptime monitoring active (optional: UptimeRobot)

### Logging Verification
- [ ] Winston writing to `logs/error.log`
- [ ] Winston writing to `logs/combined.log`
- [ ] Log level set to `info` (not `debug`)
- [ ] No sensitive data in logs (passwords, tokens)
- [ ] Structured logging format consistent

### Error Handling
- [ ] 404 errors return proper JSON response
- [ ] 500 errors logged to error.log
- [ ] Stack traces hidden in production (not sent to client)
- [ ] User-friendly error messages displayed
- [ ] Error tracking reporting to Sentry (if configured)

---

## Rollback Preparation

### Documentation
- [ ] Rollback procedure documented in DEPLOYMENT_GUIDE.md
- [ ] Previous deployment ID recorded
- [ ] Database state before migration documented

### Backup Verification
- [ ] Railway automatic backups enabled
- [ ] Manual database backup created (optional)
- [ ] Critical data exported (if needed)

### Rollback Plan
- [ ] Know how to rollback deployment: `railway rollback`
- [ ] Know how to reverse migrations (manual SQL)
- [ ] Team notified of deployment window
- [ ] On-call engineer identified

---

## Communication

### Team Notification
- [ ] Team notified of deployment start time
- [ ] Deployment duration estimated
- [ ] Expected downtime communicated (if any)
- [ ] Rollback trigger conditions defined

### User Communication
- [ ] Users notified of maintenance window (if needed)
- [ ] Status page updated (optional)
- [ ] Support team briefed on changes

---

## Final Checks

### Critical Path Testing
Test these user flows in production:

1. **New User Registration**
   - [ ] Navigate to signup page
   - [ ] Enter valid email/password
   - [ ] Receive success response
   - [ ] User created in database
   - [ ] JWT token returned

2. **User Login**
   - [ ] Navigate to login page
   - [ ] Enter credentials
   - [ ] Login successful
   - [ ] Redirected to dashboard
   - [ ] Token stored in localStorage

3. **Admin Organization Management**
   - [ ] Login as admin
   - [ ] Navigate to Organizations page
   - [ ] Create new organization
   - [ ] Organization appears in list
   - [ ] Edit organization details
   - [ ] Changes saved successfully

4. **User Invitation**
   - [ ] Admin invites new user
   - [ ] Email sent via SendGrid
   - [ ] Invitation token created
   - [ ] User accepts invitation
   - [ ] User added to organization

5. **File Upload**
   - [ ] Navigate to document upload
   - [ ] Select file (PDF, image)
   - [ ] File uploads to Cloudinary
   - [ ] File appears in database
   - [ ] File accessible via download link

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### Accessibility
- [ ] Keyboard navigation working
- [ ] Screen reader compatible
- [ ] Color contrast WCAG AA compliant
- [ ] Focus indicators visible

---

## Sign-Off

### Deployment Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Developer | _________ | _________ | __/__/____ |
| QA/Tester | _________ | _________ | __/__/____ |
| Product Owner | _________ | _________ | __/__/____ |
| DevOps/Ops | _________ | _________ | __/__/____ |

### Deployment Details

- **Deployment Date:** __/__/____ at __:__ (timezone)
- **Version:** v________
- **Git Commit:** ________________
- **Deployed By:** ________________
- **Rollback Deadline:** __/__/____ at __:__ (if issues found)

---

## Post-Deployment Monitoring

### First 24 Hours
- [ ] Monitor error rates (target: < 1%)
- [ ] Monitor response times (target: < 200ms avg)
- [ ] Monitor database performance
- [ ] Monitor memory usage (Railway)
- [ ] Check for unexpected errors in Sentry
- [ ] Review Winston error logs

### First Week
- [ ] Daily error log review
- [ ] User feedback collected
- [ ] Performance metrics reviewed
- [ ] Database query optimization if needed
- [ ] Rate limit adjustments if needed

---

## Issue Response

### If Errors Detected

1. **Minor Issues (< 5% error rate)**
   - Log issue in bug tracker
   - Create hotfix branch
   - Test fix locally
   - Deploy hotfix via Railway
   - Monitor for 1 hour

2. **Major Issues (5-20% error rate)**
   - Alert team immediately
   - Investigate root cause
   - Create hotfix or prepare rollback
   - Deploy fix within 2 hours
   - Post-mortem scheduled

3. **Critical Issues (> 20% error rate)**
   - **ROLLBACK IMMEDIATELY**
   - Execute: `railway rollback`
   - Notify all stakeholders
   - Investigate offline
   - Post-mortem required
   - Re-deployment with fix

---

## Notes

Use this space for deployment-specific notes:

```
Deployment Notes:
- 
- 
- 
```

---

**Checklist Version:** 1.0.0  
**Last Updated:** January 2024  
**Next Review:** Every major deployment
