const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY && !process.env.SENDGRID_API_KEY.startsWith('YOUR_')) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@devcollab.io';
const FROM_NAME = 'DevCollab';

const sendWelcomeEmail = async (toEmail, name) => {
  const msg = {
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: '🚀 Welcome to DevCollab!',
    html: `
      <div style="font-family: Inter, sans-serif; background: #0d0f14; color: #e2e8f0; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
        <h1 style="color: #6c63ff; font-size: 28px;">Welcome, ${name}! 🎉</h1>
        <p style="font-size: 16px; line-height: 1.6;">
          You've joined <strong>DevCollab</strong> — the platform where developers share, collaborate on, and discover amazing code snippets in real time.
        </p>
        <a href="${process.env.CLIENT_URL}" style="display: inline-block; background: linear-gradient(135deg, #6c63ff, #a855f7); color: white; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 20px;">
          Start Exploring →
        </a>
        <p style="margin-top: 30px; color: #64748b; font-size: 13px;">The DevCollab Team</p>
      </div>
    `,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('SendGrid welcome email error:', err.response?.body || err.message);
  }
};

const sendNotificationEmail = async (toEmail, subject, bodyHtml) => {
  const msg = {
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    html: `
      <div style="font-family: Inter, sans-serif; background: #0d0f14; color: #e2e8f0; padding: 40px; border-radius: 16px; max-width: 600px; margin: auto;">
        ${bodyHtml}
        <p style="margin-top: 30px; color: #64748b; font-size: 13px;">The DevCollab Team</p>
      </div>
    `,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('SendGrid notification email error:', err.response?.body || err.message);
  }
};

module.exports = { sendWelcomeEmail, sendNotificationEmail };
