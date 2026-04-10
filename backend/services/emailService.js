const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});


const templates = {
  verifyEmail: (data) => ({
    subject: '💖 Welcome to Spark – Verify your email',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1C1C2E;color:#fff;padding:40px;border-radius:16px">
      <h1 style="background:linear-gradient(135deg,#FF2D55,#BF5AF2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:32px">Spark 💖</h1>
      <h2>Welcome, ${data.name}!</h2>
      <p style="color:#aaa">You're one step away from finding your spark. Verify your email to get started.</p>
      <a href="${data.verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF2D55,#BF5AF2);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;margin-top:20px">Verify Email ✨</a>
      <p style="color:#666;font-size:12px;margin-top:40px">This link expires in 24 hours.</p>
    </div>`,
  }),
  resetPassword: (data) => ({
    subject: '🔑 Reset your Spark password',
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#1C1C2E;color:#fff;padding:40px;border-radius:16px">
      <h1 style="background:linear-gradient(135deg,#FF2D55,#BF5AF2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:32px">Spark 💖</h1>
      <h2>Password Reset</h2>
      <p style="color:#aaa">Hi ${data.name}, here's your password reset link:</p>
      <a href="${data.resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF2D55,#BF5AF2);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;margin-top:20px">Reset Password 🔑</a>
      <p style="color:#666;font-size:12px;margin-top:40px">Expires in 1 hour. Ignore if you didn't request this.</p>
    </div>`,
  }),
};

exports.sendEmail = async ({ to, subject, template, data }) => {
  try {
    const tmpl = templates[template]?.(data) || { subject, html: data.html || '' };
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject: tmpl.subject,
      html: tmpl.html,
    });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error(`Email failed to ${to}: ${err.message}`);
    throw err;
  }
};
