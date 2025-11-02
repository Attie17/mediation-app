# Production Deployment Guide

Complete guide for deploying the Mediation App to production using Railway.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment](#railway-deployment)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running Migrations](#running-migrations)
6. [Health Checks](#health-checks)
7. [Monitoring & Logging](#monitoring--logging)
8. [Rollback Procedures](#rollback-procedures)
9. [Common Issues](#common-issues)

---

## Prerequisites

### Required Accounts
- ✅ Railway account (https://railway.app)
- ✅ Cloudinary account (https://cloudinary.com)
- ✅ SendGrid account (https://sendgrid.com)
- ✅ Sentry account (optional, for error tracking: https://sentry.io)
- ✅ Google Analytics account (optional: https://analytics.google.com)

### Required Tools
```bash
# Install Railway CLI
npm install -g @railway/cli

# Verify installation
railway --version
```

### Pre-Deployment Checklist
- [ ] All environment variables documented in `.env.example`
- [ ] Database migrations tested locally
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled
- [ ] Input validation on all routes
- [ ] Error handling and logging implemented
- [ ] Frontend build successful (`npm run build`)
- [ ] Backend tests passing
- [ ] All secrets rotated (new JWT_SECRET, SESSION_SECRET)

---

## Railway Deployment

### Step 1: Login to Railway
```bash
# Login via browser
railway login

# Verify login
railway whoami
```

### Step 2: Create New Project
```bash
# Create project
railway init

# Follow prompts:
# - Project name: mediation-app-production
# - Environment: production
```

### Step 3: Link Local Repository
```bash
# Link to Railway project
railway link

# Verify connection
railway status
```

### Step 4: Add PostgreSQL Database
```bash
# Add PostgreSQL plugin via Railway CLI
railway add

# Select: PostgreSQL
# Railway will automatically provision database and set DATABASE_URL
```

### Step 5: Deploy Backend
```bash
# Navigate to backend folder
cd backend

# Deploy backend service
railway up

# Set service name
railway service backend

# Configure start command
railway variables set START_COMMAND="node src/index.js"
```

### Step 6: Deploy Frontend
```bash
# Navigate to frontend folder
cd ../frontend

# Build production bundle
npm run build

# Deploy frontend service
railway up

# Set service name
railway service frontend

# Configure as static site
railway variables set BUILD_COMMAND="npm run build"
railway variables set START_COMMAND="npx serve -s dist -p $PORT"
```

---

## Database Setup

### Automatic Setup (via Railway)
Railway automatically creates a PostgreSQL database with connection string available as `DATABASE_URL`.

### Manual Verification
```bash
# Connect to Railway database
railway connect postgres

# Verify connection
\dt

# Exit
\q
```

### Database Configuration
Railway sets these environment variables automatically:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database user
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

---

## Environment Configuration

### Backend Environment Variables

Set via Railway dashboard or CLI:

```bash
# Navigate to backend service
railway service backend

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=4000

# JWT & Sessions (GENERATE NEW SECRETS!)
railway variables set JWT_SECRET="<generate-256-bit-secret>"
railway variables set JWT_EXPIRES_IN="7d"
railway variables set SESSION_SECRET="<generate-256-bit-secret>"

# CORS
railway variables set CORS_ORIGIN="https://your-frontend-domain.railway.app"

# Email (SendGrid)
railway variables set SMTP_HOST="smtp.sendgrid.net"
railway variables set SMTP_PORT=587
railway variables set SMTP_SECURE=false
railway variables set SMTP_USER="apikey"
railway variables set SMTP_PASS="<your-sendgrid-api-key>"
railway variables set EMAIL_FROM="noreply@yourdomain.com"
railway variables set EMAIL_FROM_NAME="Mediation Platform"

# Cloudinary
railway variables set CLOUDINARY_CLOUD_NAME="<your-cloud-name>"
railway variables set CLOUDINARY_API_KEY="<your-api-key>"
railway variables set CLOUDINARY_API_SECRET="<your-api-secret>"
railway variables set CLOUDINARY_UPLOAD_PRESET="mediation_uploads"

# Security
railway variables set ENABLE_RATE_LIMITING=true
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Logging
railway variables set LOG_LEVEL=info
railway variables set LOG_FILE_ENABLED=true

# Sentry (optional)
railway variables set SENTRY_DSN="<your-sentry-dsn>"
railway variables set SENTRY_ENVIRONMENT="production"

# Features
railway variables set ENABLE_AI_FEATURES=true
railway variables set ENABLE_EMAIL_NOTIFICATIONS=true
```

### Frontend Environment Variables

```bash
# Navigate to frontend service
railway service frontend

# API Configuration
railway variables set VITE_API_BASE_URL="https://your-backend-domain.railway.app"

# Features
railway variables set VITE_ENABLE_AI_FEATURES=true
railway variables set VITE_ENABLE_ANALYTICS=true

# Analytics (optional)
railway variables set VITE_GA_TRACKING_ID="<your-ga-id>"
railway variables set VITE_PLAUSIBLE_DOMAIN="yourdomain.com"

# Sentry (optional)
railway variables set VITE_SENTRY_DSN="<your-frontend-sentry-dsn>"

# App Info
railway variables set VITE_APP_VERSION="1.0.0"
railway variables set VITE_SUPPORT_EMAIL="support@yourdomain.com"
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Running Migrations

### Via Railway CLI

```bash
# Connect to backend service
railway service backend

# Apply foundational schema (multi-statement SQL)
railway run node run-migration.js

# Run incremental migrations (examples)
railway run node migrations/002-backfill-organizations.js
railway run node migrations/005-add-performance-indexes.js

# Apply SQL migrations as needed (psql example)
railway connect postgres
# In psql, run e.g.:
\i backend/migrations/20251009_case_overview_indexes.sql
\q
```

> Note: The repository contains both SQL and JavaScript migrations. Review `backend/migrations/` and apply files in chronological order. When in doubt, run `ls backend/migrations` locally and execute pending scripts one at a time. Keep a changelog of what has been applied in production.

### Via Railway Dashboard

1. Go to Railway dashboard
2. Select your backend service
3. Go to **Settings** → **Deployments**
4. Add build command: `npm install`
5. Add start command: `node src/index.js`
6. Trigger migrations manually via **Run Command** when deploying (see CLI commands above)

---

## Health Checks

### Backend Health Check

Railway automatically monitors:
```
GET https://your-backend-domain.railway.app/healthz
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Test Health Manually

```bash
# Via curl
curl https://your-backend-domain.railway.app/healthz

# Should return: {"status":"ok","timestamp":"...","database":"connected"}
```

### Configure Railway Health Checks

In Railway dashboard:
1. Go to backend service
2. Settings → Health Checks
3. Set:
   - Path: `/healthz`
   - Interval: 30 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 2
   - Unhealthy threshold: 3

---

## Monitoring & Logging

### Railway Logs

```bash
# View live logs
railway logs

# Follow logs
railway logs --follow

# Filter by service
railway service backend
railway logs
```

### Winston Log Files (Backend)

Logs are stored in `backend/logs/`:
- `error.log` - Error level logs only
- `combined.log` - All logs (info, warn, error)

Access via Railway:
```bash
railway service backend
railway shell

# Inside container
ls -lh logs/
tail -f logs/combined.log
```

### Sentry Error Tracking

If Sentry is configured:
1. Go to https://sentry.io
2. Select your project
3. View errors in real-time
4. Set up alerts for critical errors

### Recommended Alerts

Set up alerts for:
- ❌ 500 errors (server errors)
- 🔒 Authentication failures (brute force attempts)
- 📊 High rate limit hits (potential abuse)
- 🗄️ Database connection failures
- 💾 Disk space warnings (Railway)
- 🚀 Deployment failures

---

## Rollback Procedures

### Rollback Deployment

```bash
# View deployment history
railway deployments

# Rollback to previous deployment
railway rollback

# Rollback to specific deployment
railway rollback <deployment-id>
```

### Rollback Database Migration

⚠️ **CAUTION:** Database rollbacks are destructive!

```bash
# Connect to database
railway connect postgres

# In psql, manually reverse migration
# Example: Drop indexes from migration 005
DROP INDEX IF EXISTS idx_app_users_email;
DROP INDEX IF EXISTS idx_app_users_role;
-- ... etc

# Exit
\q
```

### Emergency Shutdown

```bash
# Stop service immediately
railway service backend
railway down

# Or via dashboard: Project → Service → Stop
```

---

## Common Issues

### Issue: "Failed to fetch" in frontend

**Cause:** CORS misconfiguration

**Solution:**
```bash
# Verify CORS_ORIGIN matches frontend URL
railway service backend
railway variables get CORS_ORIGIN

# Update if needed
railway variables set CORS_ORIGIN="https://your-actual-frontend.railway.app"

# Restart service
railway restart
```

---

### Issue: Database connection refused

**Cause:** DATABASE_URL not set or incorrect

**Solution:**
```bash
# Check DATABASE_URL
railway service backend
railway variables get DATABASE_URL

# If missing, re-add PostgreSQL
railway add
# Select: PostgreSQL

# Restart
railway restart
```

---

### Issue: 500 errors after deployment

**Cause:** Missing environment variables

**Solution:**
```bash
# Check all required variables are set
railway service backend
railway variables

# Compare with .env.production template
# Add any missing variables
railway variables set VARIABLE_NAME="value"
```

---

### Issue: Rate limiting too strict

**Cause:** Default rate limits blocking legitimate traffic

**Solution:**
```bash
# Increase rate limits
railway variables set RATE_LIMIT_MAX_REQUESTS=500
railway variables set AUTH_RATE_LIMIT_MAX_REQUESTS=20

# Restart
railway restart
```

---

### Issue: Email not sending

**Cause:** SendGrid credentials incorrect

**Solution:**
```bash
# Verify SendGrid variables
railway variables get SMTP_USER
railway variables get SMTP_PASS

# Test SendGrid API key via curl
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'

# Update if needed
railway variables set SMTP_PASS="<correct-api-key>"
```

---

### Issue: Cloudinary uploads failing

**Cause:** Invalid Cloudinary credentials

**Solution:**
```bash
# Verify Cloudinary variables
railway variables get CLOUDINARY_CLOUD_NAME
railway variables get CLOUDINARY_API_KEY
railway variables get CLOUDINARY_API_SECRET

# Test via Cloudinary dashboard
# Settings → Upload presets → Create "mediation_uploads"

# Update variables
railway variables set CLOUDINARY_UPLOAD_PRESET="mediation_uploads"
```

---

### Issue: High memory usage

**Cause:** Winston file logging accumulating

**Solution:**
```bash
# Connect to service
railway shell

# Check log file sizes
ls -lh logs/

# Clear old logs
rm logs/error.log.*
rm logs/combined.log.*

# Or disable file logging temporarily
railway variables set LOG_FILE_ENABLED=false
```

---

### Issue: Slow database queries

**Cause:** Missing indexes

**Solution:**
```bash
# Verify indexes were created
railway connect postgres

# In psql
\di

# Should see idx_app_users_email, idx_cases_status, etc.
# If missing, re-run migration
railway run node migrations/005-add-performance-indexes.js
```

---

## Production Readiness Checklist

Before going live:

### Security
- [ ] All secrets rotated (JWT_SECRET, SESSION_SECRET)
- [ ] HTTPS enabled (Railway provides automatically)
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection enabled

### Performance
- [ ] Database indexes created
- [ ] Frontend build optimized (minified)
- [ ] Static assets cached
- [ ] API response times < 200ms
- [ ] Database connection pooling configured

### Monitoring
- [ ] Health checks configured
- [ ] Error tracking enabled (Sentry)
- [ ] Logging configured (Winston)
- [ ] Alerts set up for critical errors
- [ ] Uptime monitoring active

### Backup & Recovery
- [ ] Database backups enabled (Railway automatic)
- [ ] Rollback procedure documented
- [ ] Disaster recovery plan created
- [ ] Test data removed from production

### Documentation
- [ ] API documentation updated
- [ ] Environment variables documented
- [ ] Deployment guide completed
- [ ] Runbook for on-call engineers
- [ ] User documentation updated

---

## Support & Resources

### Railway Resources
- 📖 Documentation: https://docs.railway.app
- 💬 Discord: https://discord.gg/railway
- 🎫 Support: help@railway.app

### External Services
- 📧 SendGrid Docs: https://docs.sendgrid.com
- 📷 Cloudinary Docs: https://cloudinary.com/documentation
- 🐛 Sentry Docs: https://docs.sentry.io

### Project Maintainers
- 📧 Support Email: support@yourdomain.com
- 🐛 Bug Reports: GitHub Issues
- 💡 Feature Requests: GitHub Discussions

---

**Last Updated:** January 2024  
**Version:** 1.0.0
