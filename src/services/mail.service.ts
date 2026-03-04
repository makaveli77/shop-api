import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'ethereal_user',
    pass: process.env.EMAIL_PASS || 'ethereal_pass',
  },
});

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const mailOptions = {
    from: '"Shop API" <noreply@shop-api.com>',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h3>Password Reset</h3>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link is valid for 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
    // In development, log the link so the developer can still test
    if (process.env.NODE_ENV !== 'production') { // eslint-disable-next-line no-console
      console.log('Development Mode - Reset Link:', resetLink);
    }
  }
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: '"Shop API" <noreply@shop-api.com>',
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h3>Welcome to Shop API!</h3>
      <p>Please click the link below to verify your email address and activate your account:</p>
      <a href="${verifyLink}">Verify Email</a>
      <p>This link is valid for 24 hours.</p>
      <p>If you did not create an account, please ignore this email.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification Email sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error: Error | any) {
    console.error('Error sending verification email:', error);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development Mode - Verify Link:', verifyLink);
    }
  }
};
