import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';
import { EmailOptions } from '../interfaces';

let transporter: Transporter;

const getTransporter = (): Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    logger.info(`Email sent to: ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

// ============================================================
// Email Templates
// ============================================================

const baseTemplate = (content: string, title: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; }
    .header p { color: #c9a84c; margin: 5px 0 0; font-size: 14px; }
    .content { padding: 35px; color: #333; line-height: 1.6; }
    .content h2 { color: #1a1a2e; }
    .btn { display: inline-block; padding: 14px 32px; background: #c9a84c; color: #1a1a2e; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
    .info-box { background: #f0f4ff; border-left: 4px solid #c9a84c; padding: 15px; border-radius: 4px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏨 Hotel & Resort</h1>
      <p>${title}</p>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Hotel & Resort Management System. All rights reserved.</p>
      <p>If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`;

export const emailTemplates = {
  verifyEmail: (name: string, verifyUrl: string): string =>
    baseTemplate(
      `<h2>Welcome, ${name}! 🎉</h2>
      <p>Please verify your email address to activate your account.</p>
      <div class="info-box"><strong>This link expires in 24 hours.</strong></div>
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>`,
      'Email Verification',
    ),

  resetPassword: (name: string, resetUrl: string): string =>
    baseTemplate(
      `<h2>Reset Your Password</h2>
      <p>Hi ${name}, we received a request to reset your password.</p>
      <div class="info-box"><strong>⚠️ This link expires in 1 hour.</strong></div>
      <a href="${resetUrl}" class="btn">Reset Password</a>`,
      'Password Reset',
    ),

  bookingConfirmation: (
    name: string,
    details: { bookingNumber: string; roomNumber: string; checkIn: string; checkOut: string; nights: number; total: number; currency: string },
  ): string =>
    baseTemplate(
      `<h2>Booking Confirmed! ✅</h2>
      <p>Dear ${name}, your reservation has been confirmed.</p>
      <div class="info-box">
        <strong>Booking #${details.bookingNumber}</strong><br>
        Room: ${details.roomNumber}<br>
        Check-in: ${details.checkIn}<br>
        Check-out: ${details.checkOut}<br>
        Duration: ${details.nights} night(s)<br>
        Total: ${details.currency} ${details.total.toLocaleString()}
      </div>`,
      'Booking Confirmation',
    ),

  bookingCancellation: (name: string, bookingNumber: string, reason?: string): string =>
    baseTemplate(
      `<h2>Booking Cancelled</h2>
      <p>Dear ${name}, booking <strong>#${bookingNumber}</strong> has been cancelled.</p>
      ${reason ? `<div class="info-box"><strong>Reason:</strong> ${reason}</div>` : ''}`,
      'Booking Cancellation',
    ),

  paymentReceived: (name: string, amount: number, currency: string, transactionId: string): string =>
    baseTemplate(
      `<h2>Payment Received ✅</h2>
      <p>Dear ${name}, we've received your payment.</p>
      <div class="info-box">
        <strong>Amount:</strong> ${currency} ${amount.toLocaleString()}<br>
        <strong>Transaction ID:</strong> ${transactionId}<br>
        <strong>Date:</strong> ${new Date().toLocaleDateString()}
      </div>`,
      'Payment Confirmation',
    ),

  welcomeStaff: (name: string, role: string, tempPassword: string, loginUrl: string): string =>
    baseTemplate(
      `<h2>Welcome to the Team, ${name}! 👋</h2>
      <p>Your staff account has been created.</p>
      <div class="info-box">
        <strong>Role:</strong> ${role}<br>
        <strong>Temporary Password:</strong> <code>${tempPassword}</code>
      </div>
      <a href="${loginUrl}" class="btn">Login Now</a>
      <p><strong>⚠️ Please change your password immediately after logging in.</strong></p>`,
      'Staff Account Created',
    ),
};
