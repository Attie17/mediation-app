# Email Service Configuration Guide

This guide explains how to configure the email service for session reminders in the Mediation Platform.

## Overview

The email service supports multiple providers:
- **Ethereal** (Development) - Fake SMTP for testing
- **SendGrid** (Recommended for Production)
- **AWS SES** (Cost-effective for high volume)
- **Custom SMTP** (Any SMTP server)

## Configuration

Add these environment variables to your `.env` file in the `backend` directory:

### Development Mode (Ethereal - Default)

```env
EMAIL_SERVICE=ethereal
```

No additional configuration needed. Preview URLs will be logged to console.

### SendGrid Configuration

```env
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Setup Steps:**
1. Sign up at [https://sendgrid.com](https://sendgrid.com)
2. Create an API key in Settings > API Keys
3. Verify your sender email or domain
4. Add credentials to `.env`

### AWS SES Configuration

```env
EMAIL_SERVICE=ses
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@yourdomain.com
```

**Setup Steps:**
1. Go to AWS SES Console
2. Verify your email or domain
3. Create IAM user with SES permissions
4. Generate access key credentials
5. Add credentials to `.env`

### Custom SMTP Configuration

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=noreply@yourdomain.com
```

**Examples:**
- **Gmail**: smtp.gmail.com (requires App Password)
- **Outlook**: smtp-mail.outlook.com
- **Custom**: Your organization's SMTP server

## Installation

Install the required dependency:

```powershell
cd backend
npm install nodemailer
```

## Testing

### Test Email Endpoint

You can create a test endpoint to verify your email configuration:

**Add to `backend/src/routes/sessions.js`:**

```javascript
import { sendTestEmail } from '../services/emailService.js';

// Test email endpoint (for development only)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await sendTestEmail(email || req.user.email);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ 
      ok: false, 
      error: error.message 
    });
  }
});
```

**Test with cURL:**

```powershell
# Test email sending
curl -X POST http://localhost:4000/api/sessions/test-email `
  -H "Authorization: Bearer YOUR_JWT_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"email": "test@example.com"}'
```

### Manual Test

```javascript
// In Node.js REPL or test script
import { sendTestEmail } from './backend/src/services/emailService.js';

const result = await sendTestEmail('your-email@example.com');
console.log(result);
```

## Email Template Customization

The email template is defined in `backend/src/services/emailService.js` in the `generateReminderEmail()` function.

**Template Features:**
- Responsive HTML design
- Session details (date, time, location, notes)
- Branded header with gradient
- Plain text fallback for email clients that don't support HTML

**To Customize:**
1. Edit `generateReminderEmail()` function
2. Modify HTML/CSS in the template string
3. Update branding colors, logo, footer text
4. Add your organization's contact information

## Automatic Reminders (Future Enhancement)

To implement automatic reminders (24h before, 1h before):

### Option 1: Node-Cron (Simple)

```javascript
import cron from 'node-cron';

// Run every hour
cron.schedule('0 * * * *', async () => {
  // Find sessions in next 24 hours without reminder
  const sessions = await getSessionsNeedingReminder();
  for (const session of sessions) {
    await sendSessionReminder(session);
  }
});
```

### Option 2: Bull Queue (Production)

```javascript
import Queue from 'bull';

const reminderQueue = new Queue('session-reminders', process.env.REDIS_URL);

// Process reminder jobs
reminderQueue.process(async (job) => {
  const { sessionId } = job.data;
  const session = await getSession(sessionId);
  await sendSessionReminder(session);
});

// Schedule reminder when session is created
async function scheduleReminder(session) {
  const sessionTime = new Date(session.session_date + 'T' + session.session_time);
  const reminderTime = new Date(sessionTime.getTime() - 24 * 60 * 60 * 1000);
  
  await reminderQueue.add(
    { sessionId: session.id },
    { delay: reminderTime.getTime() - Date.now() }
  );
}
```

### Option 3: Supabase Edge Functions (Serverless)

Create a Supabase Edge Function that runs on a schedule to check for sessions needing reminders.

## Troubleshooting

### Common Issues

**1. "EAUTH" or authentication errors**
- Verify your API key or credentials
- Check if 2FA is enabled (may need app password)
- Ensure email service is correctly specified

**2. Emails go to spam**
- Verify sender domain in your email provider
- Set up SPF, DKIM, and DMARC records
- Use a professional email address (not @gmail.com)

**3. "Connection timeout" errors**
- Check firewall settings
- Verify SMTP port (587 for TLS, 465 for SSL)
- Ensure SMTP_SECURE matches port

**4. Preview URL in development**
- With Ethereal, check console logs for preview URL
- URL expires after 24 hours
- Only available in development mode

### Debugging

Enable debug logging:

```javascript
// In emailService.js
const transporter = await createTransporter();
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});
```

## Production Checklist

- [ ] Email service configured (SendGrid or AWS SES)
- [ ] Sender email/domain verified
- [ ] SPF/DKIM/DMARC records configured
- [ ] Test emails sent successfully
- [ ] Rate limits configured (if applicable)
- [ ] Error monitoring in place
- [ ] Bounce/complaint handling configured
- [ ] Unsubscribe mechanism (if sending marketing emails)

## Cost Estimates

### SendGrid
- Free: 100 emails/day
- Essentials: $19.95/month (50,000 emails)
- Pro: Custom pricing

### AWS SES
- $0.10 per 1,000 emails
- First 62,000 emails/month free (if using EC2)
- Very cost-effective for high volume

### Gmail/Custom SMTP
- Usually free but limited sending rate
- Not recommended for production (reputation issues)

## Security Best Practices

1. **Never commit credentials to Git**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in production

2. **Rotate API keys regularly**
   - Set calendar reminder to rotate every 90 days
   - Revoke old keys after rotation

3. **Monitor for abuse**
   - Set up alerts for high send volumes
   - Monitor bounce/complaint rates
   - Implement rate limiting

4. **Use TLS/SSL**
   - Always use secure connections
   - Set `SMTP_SECURE=true` for port 465
   - Use port 587 with STARTTLS

## Support

For issues with specific email providers:
- **SendGrid**: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- **AWS SES**: [https://docs.aws.amazon.com/ses](https://docs.aws.amazon.com/ses)
- **Nodemailer**: [https://nodemailer.com](https://nodemailer.com)
