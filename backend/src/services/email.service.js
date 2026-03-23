const { Resend } = require('resend');
const logger = require('../utils/logger');


const resend = new Resend(process.env.RESEND_API_KEY);

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FlixVideo <onboarding@resend.dev>', // Resend's test domain
      to: email,
      subject: 'Password Reset Request - FlixVideo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 10px 10px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .content { 
              background: #f9f9f9; 
              padding: 30px; 
              border-radius: 0 0 10px 10px; 
            }
            .button { 
              display: inline-block; 
              padding: 15px 40px; 
              background: #667eea; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background: #5568d3;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #666; 
              font-size: 12px; 
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 FlixVideo</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Password Reset Request</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>You requested to reset your password for your FlixVideo account. Click the button below to create a new password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset My Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea; background: white; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This link will expire in 1 hour for security reasons.
              </div>
              
              <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The FlixVideo Team</strong>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} FlixVideo. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('❌ Resend email error:', error);
      return false;
    }

    logger.info(`✅ Password reset email sent to ${email}`, data);
    return true;
  } catch (error) {
    logger.error('❌ Email send error:', error);
    return false;
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FlixVideo <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to FlixVideo! 🎬',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 40px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 36px;
            }
            .content {
              background: #f9f9f9;
              padding: 40px;
              border-radius: 0 0 10px 10px;
            }
            .feature {
              background: white;
              padding: 15px;
              margin: 10px 0;
              border-radius: 5px;
              border-left: 4px solid #667eea;
            }
            .cta {
              text-align: center;
              margin: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background: #667eea;
              color: white !important;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to FlixVideo!</h1>
              <p style="margin: 10px 0 0 0; font-size: 18px;">Hi ${username}!</p>
            </div>
            <div class="content">
              <p style="font-size: 18px;">
                <strong>Thank you for joining FlixVideo!</strong>
              </p>
              <p>
                You're now part of the ultimate AI-powered movie discovery platform. 
                Get ready to discover amazing movies and TV shows tailored just for you!
              </p>
              
              <h3 style="color: #667eea; margin-top: 30px;">🎬 What you can do:</h3>
              
              <div class="feature">
                <strong>🔍 Smart Search</strong><br>
                Find exactly what you want to watch with AI-powered recommendations
              </div>
              
              <div class="feature">
                <strong>⭐ Personal Watchlist</strong><br>
                Save movies and shows to watch later
              </div>
              
              <div class="feature">
                <strong>💬 AI Chat Assistant</strong><br>
                Get personalized movie suggestions by chatting with our AI
              </div>
              
              <div class="feature">
                <strong>👥 Social Features</strong><br>
                Create watch parties and share lists with friends
              </div>
              
              <div class="cta">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">
                  Start Exploring
                </a>
              </div>
              
              <p style="margin-top: 30px;">
                If you have any questions, feel free to reach out to our support team.
              </p>
              
              <p>
                Happy watching! 🍿<br>
                <strong>The FlixVideo Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('❌ Welcome email error:', error);
      return false;
    }

    logger.info(`✅ Welcome email sent to ${email}`, data);
    return true;
  } catch (error) {
    logger.error('❌ Welcome email send error:', error);
    return false;
  }
};

// Send verification email
const sendVerificationEmail = async (email, verificationUrl) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FlixVideo <onboarding@resend.dev>',
      to: email,
      subject: 'Verify Your Email - FlixVideo',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0;">🎬 FlixVideo</h1>
              <p style="margin: 10px 0 0 0;">Verify Your Email</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Please verify your email address to complete your registration:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; padding: 15px 40px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Verify Email
                </a>
              </div>
              <p>Or copy this link: <br><span style="color: #667eea;">${verificationUrl}</span></p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      logger.error('❌ Verification email error:', error);
      return false;
    }

    logger.info(`✅ Verification email sent to ${email}`, data);
    return true;
  } catch (error) {
    logger.error('❌ Verification email send error:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationEmail
};
