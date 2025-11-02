/**
 * Email Service
 * Handles sending session reminders and other notifications
 * 
 * Integration Options:
 * - SendGrid (recommended for production)
 * - AWS SES (cost-effective for high volume)
 * - Nodemailer with SMTP (for custom email servers)
 */

import nodemailer from 'nodemailer';

// Configuration
const EMAIL_CONFIG = {
  // For development: Use ethereal email (fake SMTP service)
  // For production: Configure with SendGrid, AWS SES, or custom SMTP
  service: process.env.EMAIL_SERVICE || 'ethereal',
  
  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mediation-app.com'
  },
  
  // AWS SES configuration
  ses: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    from: process.env.SES_FROM_EMAIL || 'noreply@mediation-app.com'
  },
  
  // Custom SMTP configuration
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    from: process.env.SMTP_FROM_EMAIL || 'noreply@mediation-app.com'
  }
};

/**
 * Create email transporter based on configuration
 */
async function createTransporter() {
  const service = EMAIL_CONFIG.service;

  switch (service) {
    case 'sendgrid':
      // Use SendGrid via nodemailer
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: EMAIL_CONFIG.sendgrid.apiKey
        }
      });

    case 'ses':
      // Use AWS SES
      return nodemailer.createTransport({
        service: 'SES',
        auth: {
          accessKeyId: EMAIL_CONFIG.ses.accessKeyId,
          secretAccessKey: EMAIL_CONFIG.ses.secretAccessKey
        },
        region: EMAIL_CONFIG.ses.region
      });

    case 'smtp':
      // Use custom SMTP
      return nodemailer.createTransport(EMAIL_CONFIG.smtp);

    case 'ethereal':
    default:
      // Development mode: Use Ethereal (creates test account)
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
  }
}

/**
 * Generate session reminder email HTML
 */
function generateReminderEmail(session, recipientName) {
  const sessionDate = new Date(`${session.session_date}T${session.session_time}`);
  const dateStr = sessionDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
  const timeStr = sessionDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%);
      padding: 30px 40px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #475569;
    }
    .session-info {
      background-color: #f1f5f9;
      border-left: 4px solid #14b8a6;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .session-info h2 {
      margin: 0 0 15px 0;
      font-size: 20px;
      color: #0f172a;
    }
    .info-row {
      display: flex;
      align-items: center;
      margin: 10px 0;
      color: #475569;
    }
    .info-label {
      font-weight: 600;
      min-width: 100px;
      color: #334155;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 40px;
      text-align: center;
      font-size: 14px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%);
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Mediation Session Reminder</h1>
    </div>
    
    <div class="content">
      <p class="greeting">Hello ${recipientName},</p>
      
      <p>This is a friendly reminder about your upcoming mediation session:</p>
      
      <div class="session-info">
        <h2>${session.title}</h2>
        
        <div class="info-row">
          <span class="info-label">📅 Date:</span>
          <span>${dateStr}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">🕐 Time:</span>
          <span>${timeStr}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">⏱️ Duration:</span>
          <span>${session.duration_minutes || 60} minutes</span>
        </div>
        
        ${session.location ? `
        <div class="info-row">
          <span class="info-label">📍 Location:</span>
          <span>${session.location}</span>
        </div>
        ` : ''}
        
        ${session.notes ? `
        <div class="info-row" style="margin-top: 15px;">
          <span class="info-label">📝 Notes:</span>
        </div>
        <div style="margin-top: 5px; color: #475569;">
          ${session.notes}
        </div>
        ` : ''}
      </div>
      
      <p>Please make sure you're prepared and arrive on time. If you need to reschedule or have any questions, please contact your mediator as soon as possible.</p>
      
      <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
        If you have any questions or concerns, please don't hesitate to reach out.
      </p>
    </div>
    
    <div class="footer">
      <p>This is an automated reminder from the Mediation Platform</p>
      <p style="margin-top: 5px;">© ${new Date().getFullYear()} Mediation App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Send session reminder emails to participants
 */
export async function sendSessionReminder(session, participants) {
  try {
    const transporter = await createTransporter();
    const fromEmail = EMAIL_CONFIG[EMAIL_CONFIG.service]?.from || 'noreply@mediation-app.com';
    
    const results = [];
    
    for (const participant of participants) {
      try {
        const emailHtml = generateReminderEmail(session, participant.name);
        
        const mailOptions = {
          from: fromEmail,
          to: participant.email,
          subject: `Reminder: ${session.title} - ${new Date(session.session_date).toLocaleDateString()}`,
          html: emailHtml,
          text: `
Mediation Session Reminder

Hello ${participant.name},

This is a reminder about your upcoming mediation session:

Title: ${session.title}
Date: ${new Date(`${session.session_date}T${session.session_time}`).toLocaleDateString()}
Time: ${new Date(`${session.session_date}T${session.session_time}`).toLocaleTimeString()}
Duration: ${session.duration_minutes || 60} minutes
${session.location ? `Location: ${session.location}` : ''}

${session.notes ? `Notes: ${session.notes}` : ''}

Please make sure you're prepared and arrive on time.

Best regards,
Mediation Platform
          `.trim()
        };

        const info = await transporter.sendMail(mailOptions);
        
        // For development (Ethereal), log the preview URL
        if (EMAIL_CONFIG.service === 'ethereal') {
          console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }
        
        results.push({
          email: participant.email,
          success: true,
          messageId: info.messageId
        });
      } catch (error) {
        console.error(`Failed to send email to ${participant.email}:`, error);
        results.push({
          email: participant.email,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      ok: true,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    };
    
  } catch (error) {
    console.error('Email service error:', error);
    throw new Error(`Failed to send reminders: ${error.message}`);
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(recipientEmail) {
  try {
    const transporter = await createTransporter();
    const fromEmail = EMAIL_CONFIG[EMAIL_CONFIG.service]?.from || 'noreply@mediation-app.com';
    
    const testSession = {
      title: 'Test Mediation Session',
      session_date: new Date().toISOString().split('T')[0],
      session_time: '14:00',
      duration_minutes: 60,
      location: 'Conference Room A',
      notes: 'This is a test email to verify email configuration.'
    };
    
    const emailHtml = generateReminderEmail(testSession, 'Test User');
    
    const mailOptions = {
      from: fromEmail,
      to: recipientEmail,
      subject: 'Test Email - Mediation Platform',
      html: emailHtml
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    if (EMAIL_CONFIG.service === 'ethereal') {
      console.log('Test Email Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return {
      ok: true,
      messageId: info.messageId,
      previewUrl: EMAIL_CONFIG.service === 'ethereal' ? nodemailer.getTestMessageUrl(info) : null
    };
    
  } catch (error) {
    console.error('Test email error:', error);
    throw new Error(`Failed to send test email: ${error.message}`);
  }
}

export default {
  sendSessionReminder,
  sendTestEmail
};
