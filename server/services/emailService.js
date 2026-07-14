const nodemailer = require('nodemailer');

const createTransporter = () => {
  // If SMTP configurations are placeholder, return a mockup transporter
  const isMock = 
    !process.env.SMTP_USER || 
    process.env.SMTP_USER === 'your_email@gmail.com' ||
    process.env.SMTP_PASS === 'your_app_password';

  if (isMock) {
    console.log('[EmailService] SMTP credentials are not configured. Running in SIMULATOR mode.');
    return {
      sendMail: async (mailOptions) => {
        console.log('\n--- SIMULATED EMAIL SENT ---');
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content:\n${mailOptions.text || mailOptions.html}`);
        console.log('-----------------------------\n');
        return { messageId: 'simulated-id-12345' };
      }
    };
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email template
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Hospital Management System" <no-reply@hms.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // strip HTML for text fallback
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send Verification Email
 */
const sendVerificationEmail = async (to, name, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Welcome to HMS, ${name}!</h2>
      <p>Please click the button below to verify your email address and activate your account:</p>
      <a href="${url}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Verify Email</a>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #777;">HMS Team, 123 Health Ave.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'Verify your HMS Account', html });
};

/**
 * Send Password Reset Email
 */
const sendPasswordResetEmail = async (to, name, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${url}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 15px 0;">Reset Password</a>
      <p>This link is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #777;">HMS Team, 123 Health Ave.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'HMS Password Reset Request', html });
};

/**
 * Send Appointment Confirmation Email
 */
const sendAppointmentConfirmationEmail = async (to, name, details) => {
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Appointment Confirmed</h2>
      <p>Hi ${name},</p>
      <p>Your appointment has been successfully scheduled. Here are the details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Doctor:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.doctorName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Department:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.departmentName}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.date}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.time}</td></tr>
      </table>
      <p>Thank you for choosing HMS!</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #777;">HMS Team, 123 Health Ave.</p>
    </div>
  `;
  return sendEmail({ to, subject: 'HMS Appointment Confirmation', html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmationEmail,
};
