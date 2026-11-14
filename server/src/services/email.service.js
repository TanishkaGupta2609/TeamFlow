import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

// Initialize Nodemailer transporter
if (config.smtp.host && config.smtp.user) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
  });
}

/**
 * Base email layout matching TeamFlow's visual identity.
 */
const renderEmailLayout = ({ title, bodyHtml, ctaText, ctaUrl }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7F6F2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #242B27; }
    .container { max-width: 580px; margin: 32px auto; background-color: #FFFFFF; border: 1px solid #E9E7E0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(23, 63, 53, 0.05); }
    .header { background-color: #173F35; padding: 28px 32px; text-align: left; }
    .logo { color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; text-decoration: none; }
    .tagline { color: #A9B8A5; font-size: 11px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 36px 32px; line-height: 1.6; font-size: 14px; }
    .btn { display: inline-block; background-color: #173F35; color: #FFFFFF !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin: 24px 0 12px 0; }
    .footer { padding: 24px 32px; background-color: #F7F6F2; border-top: 1px solid #E9E7E0; text-align: center; font-size: 11px; color: #747B73; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">TeamFlow</div>
      <div class="tagline">Plan clearly. Work together. Deliver better.</div>
    </div>
    <div class="content">
      ${bodyHtml}
      ${ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="btn">${ctaText || 'Open in TeamFlow'}</a></div>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TeamFlow. All rights reserved.<br>
      You are receiving this email because of your active workspace account.
    </div>
  </div>
</body>
</html>
  `;
};

export class EmailService {
  /**
   * Helper to dispatch email asynchronously with error resilience.
   */
  static async sendMail({ to, subject, html, text }) {
    if (!to) return { sent: false, error: 'Recipient address required' };

    // In test environment or if transporter not configured, log and return success mock
    if (config.nodeEnv === 'test' || !transporter) {
      return {
        sent: true,
        mock: true,
        to,
        subject,
      };
    }

    try {
      const info = await transporter.sendMail({
        from: `"TeamFlow" <no-reply@teamflow.app>`,
        to,
        subject,
        html,
        text: text || subject,
      });
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      console.warn(`[EmailService] Failed to send email to ${to}: ${err.message}`);
      return { sent: false, error: err.message };
    }
  }

  /**
   * 1. Welcome Email
   */
  static async sendWelcomeEmail({ to, name }) {
    const html = renderEmailLayout({
      title: 'Welcome to TeamFlow',
      bodyHtml: `
        <h2 style="color: #173F35; margin-top: 0;">Welcome aboard, ${name}!</h2>
        <p>Your TeamFlow workspace is configured and ready. Start organizing your projects, assigning tasks to team members, and collaborating on real-time Kanban boards.</p>
        <p>If you have any questions or need onboarding guidance, our team is always here to assist.</p>
      `,
      ctaText: 'Go to Dashboard',
      ctaUrl: `${config.clientUrl}/dashboard`,
    });

    return EmailService.sendMail({
      to,
      subject: 'Welcome to TeamFlow – Plan clearly, Deliver better',
      html,
    });
  }

  /**
   * 2. Workspace Invitation Email
   */
  static async sendWorkspaceInvitationEmail({ to, inviterName, workspaceName, role, inviteUrl }) {
    const html = renderEmailLayout({
      title: `Invitation to join ${workspaceName}`,
      bodyHtml: `
        <h2 style="color: #173F35; margin-top: 0;">You've been invited!</h2>
        <p><strong>${inviterName || 'A team manager'}</strong> has invited you to collaborate in the <strong>${workspaceName}</strong> workspace on TeamFlow as a <strong>${role}</strong>.</p>
        <p>Click below to accept this invitation and access shared projects and sprint workflows:</p>
      `,
      ctaText: 'Accept Invitation',
      ctaUrl: inviteUrl || `${config.clientUrl}/accept-invitation`,
    });

    return EmailService.sendMail({
      to,
      subject: `Invitation to collaborate on ${workspaceName} in TeamFlow`,
      html,
    });
  }

  /**
   * 3. Password Reset Email
   */
  static async sendPasswordResetEmail({ to, name, resetUrl }) {
    const html = renderEmailLayout({
      title: 'Reset Your TeamFlow Password',
      bodyHtml: `
        <h2 style="color: #173F35; margin-top: 0;">Password Reset Request</h2>
        <p>Hi ${name || 'there'},</p>
        <p>We received a request to reset your password for your TeamFlow account. Click the button below to choose a new secure password:</p>
        <p style="font-size: 12px; color: #747B73;">This link is valid for 1 hour. If you did not request this, you can safely ignore this email.</p>
      `,
      ctaText: 'Reset Password',
      ctaUrl: resetUrl,
    });

    return EmailService.sendMail({
      to,
      subject: 'Reset your TeamFlow account password',
      html,
    });
  }

  /**
   * 4. Task Assignment Email
   */
  static async sendTaskAssignmentEmail({ to, name, taskTitle, projectName, workspaceName, priority, dueDate, taskUrl }) {
    const html = renderEmailLayout({
      title: `Task Assigned: ${taskTitle}`,
      bodyHtml: `
        <h2 style="color: #173F35; margin-top: 0;">New Task Assigned</h2>
        <p>Hi ${name || 'there'}, you have been assigned to a task in <strong>${workspaceName || 'your workspace'}</strong>:</p>
        <div style="background-color: #F7F6F2; padding: 16px; border-radius: 8px; border-left: 4px solid #173F35; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #173F35;">${taskTitle}</h3>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Project:</strong> ${projectName || 'General'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Priority:</strong> ${priority || 'MEDIUM'}</p>
          ${dueDate ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
        </div>
      `,
      ctaText: 'View Task in Kanban',
      ctaUrl: taskUrl || `${config.clientUrl}/tasks`,
    });

    return EmailService.sendMail({
      to,
      subject: `[Task Assigned] ${taskTitle} (${workspaceName})`,
      html,
    });
  }

  /**
   * 5. Upcoming Deadline Reminder Email
   */
  static async sendDeadlineReminderEmail({ to, name, taskTitle, workspaceName, dueDate, taskUrl }) {
    const html = renderEmailLayout({
      title: `Deadline Alert: ${taskTitle}`,
      bodyHtml: `
        <h2 style="color: #D49A52; margin-top: 0;">Upcoming Deadline Alert</h2>
        <p>Hi ${name || 'there'}, this is a reminder that the following task in <strong>${workspaceName}</strong> is approaching its scheduled deadline:</p>
        <div style="background-color: #F7F6F2; padding: 16px; border-radius: 8px; border-left: 4px solid #D49A52; margin: 16px 0;">
          <h3 style="margin: 0 0 6px 0; color: #242B27;">${taskTitle}</h3>
          <p style="margin: 4px 0; font-size: 13px; color: #D49A52;"><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
        </div>
      `,
      ctaText: 'Open Task',
      ctaUrl: taskUrl || `${config.clientUrl}/tasks`,
    });

    return EmailService.sendMail({
      to,
      subject: `[Deadline Approaching] ${taskTitle}`,
      html,
    });
  }

  /**
   * 6. Project Milestone / Assignment Email
   */
  static async sendProjectMilestoneEmail({ to, name, projectName, workspaceName, status, progress, projectUrl }) {
    const html = renderEmailLayout({
      title: `Project Update: ${projectName}`,
      bodyHtml: `
        <h2 style="color: #173F35; margin-top: 0;">Project Update: ${projectName}</h2>
        <p>Hi ${name || 'there'}, you have been added to or received an update on project <strong>${projectName}</strong> in <strong>${workspaceName}</strong>.</p>
        <div style="background-color: #F7F6F2; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> ${status || 'ACTIVE'}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Progress:</strong> ${progress || 0}%</p>
        </div>
      `,
      ctaText: 'View Project Details',
      ctaUrl: projectUrl || `${config.clientUrl}/projects`,
    });

    return EmailService.sendMail({
      to,
      subject: `[Project Update] ${projectName} (${workspaceName})`,
      html,
    });
  }
}

export default EmailService;
