/**
 * Email Service
 * Sends invitation and notification emails
 */

import nodemailer from 'nodemailer';

// Configure email transporter
const createTransporter = () => {
  // In development, use ethereal email (fake SMTP for testing)
  // In production, use real SMTP credentials from environment variables
  
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Development: log emails to console instead of sending
  return nodemailer.createTransporter({
    streamTransport: true,
    newline: 'unix',
    buffer: true
  });
};

/**
 * Send invitation email to new user
 */
export async function sendInvitationEmail({ to, organizationName, inviteUrl, message, role }) {
  const transporter = createTransporter();

  const roleLabel = {
    mediator: 'Mediator',
    lawyer: 'Lawyer',
    divorcee: 'Client'
  }[role] || role;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .button:hover {
          background: #2563eb;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
        .message-box {
          background: white;
          padding: 15px;
          border-left: 4px solid #3b82f6;
          margin: 20px 0;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>You're Invited!</h1>
      </div>
      <div class="content">
        <h2>Join ${organizationName}</h2>
        <p>You've been invited to join <strong>${organizationName}</strong> as a <strong>${roleLabel}</strong> on our mediation platform.</p>
        
        ${message ? `
          <div class="message-box">
            <strong>Personal message from your administrator:</strong><br>
            ${message}
          </div>
        ` : ''}
        
        <p>Click the button below to create your account and get started:</p>
        
        <center>
          <a href="${inviteUrl}" class="button">Accept Invitation</a>
        </center>
        
        <p style="color: #666; font-size: 14px;">
          This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${inviteUrl}" style="color: #3b82f6;">${inviteUrl}</a>
        </p>
        
        <div class="footer">
          <p>This email was sent by ${organizationName} via the Mediation Platform.</p>
          <p>© ${new Date().getFullYear()} Mediation Platform. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
You're Invited to Join ${organizationName}

You've been invited to join ${organizationName} as a ${roleLabel}.

${message ? `Personal message from your administrator:\n${message}\n\n` : ''}

Click the link below to create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Mediation Platform" <noreply@mediation.com>',
    to,
    subject: `Invitation to join ${organizationName}`,
    text: textContent,
    html: htmlContent
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // In development, log the email to console
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 ========== INVITATION EMAIL ==========');
      console.log('To:', to);
      console.log('Subject:', mailOptions.subject);
      console.log('Invite URL:', inviteUrl);
      console.log('Message:', info.message?.toString() || 'Email would be sent in production');
      console.log('=======================================\n');
    }

    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, resetUrl, name }) {
  const transporter = createTransporter();

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          padding: 30px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }
        .content {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 0 0 8px 8px;
        }
        .button {
          display: inline-block;
          background: #dc2626;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reset Your Password</h1>
      </div>
      <div class="content">
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        
        <center>
          <a href="${resetUrl}" class="button">Reset Password</a>
        </center>
        
        <p style="color: #666; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 20px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #dc2626;">${resetUrl}</a>
        </p>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Mediation Platform" <noreply@mediation.com>',
    to,
    subject: 'Reset Your Password',
    html: htmlContent
  };

  return await transporter.sendMail(mailOptions);
}
