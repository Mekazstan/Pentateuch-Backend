/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly appName: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.appName = this.configService.get<string>('APP_NAME') || 'Pentateuch';
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.fromEmail = this.configService.getOrThrow<string>('EMAIL_USER');
    this.fromName =
      this.configService.get<string>('EMAIL_FROM_NAME') || this.appName;

    // Create Nodemailer transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_APP_PASSWORD'),
      },
    });

    // Verify connection
    this.verifyConnection();
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Email service is ready to send emails');
    } catch (error) {
      this.logger.error('❌ Email service connection failed:', error.message);
      this.logger.warn(
        'Make sure EMAIL_USER and EMAIL_APP_PASSWORD are set correctly',
      );
    }
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    try {
      const resetUrl = `${this.frontendUrl}/reset-password?token=${resetToken}`;
      const htmlContent = this.generatePasswordResetHtml(resetUrl);
      const textContent = this.generatePasswordResetText(resetUrl);

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: `${this.appName} - Password Reset Request`,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`✅ Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send password reset email to ${email}:`,
        error.message,
      );
      throw new Error('Failed to send password reset email');
    }
  }

  async sendEmailVerificationCode(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    try {
      const htmlContent =
        this.generateEmailVerificationCodeHtml(verificationCode);
      const textContent =
        this.generateEmailVerificationCodeText(verificationCode);

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: `${this.appName} - Your Verification Code`,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`✅ Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send verification code to ${email}:`,
        error.message,
      );
      throw new Error('Failed to send verification code');
    }
  }

  async sendWelcomeMessage(user: any): Promise<void> {
    try {
      const htmlContent = this.generateWelcomeHtml(user);
      const textContent = this.generateWelcomeText(user);

      await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `🎉 Welcome to ${this.appName}! Start Sharing Your Faith`,
        html: htmlContent,
        text: textContent,
      });

      this.logger.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send welcome email to ${user.email}:`,
        error.message,
      );
      throw new Error('Failed to send welcome email');
    }
  }

  // Template generation methods
  private generatePasswordResetHtml(resetUrl: string): string {
    return `
<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: #4d4d4d;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #f8f9fa;
        }
        .container {
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 2px solid #f0f0f0;
        margin-bottom: 30px;
        }
        .button {
        display: inline-block;
        padding: 14px 28px;
        background-color: #8B5CF6;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 8px;
        margin: 20px 0;
        font-weight: 600;
        text-align: center;
        transition: background-color 0.2s;
        }
        .button:hover {
        background-color: #7C3AED;
        }
        .footer {
        text-align: center;
        padding-top: 30px;
        border-top: 2px solid #f0f0f0;
        margin-top: 30px;
        color: #666;
        font-size: 14px;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
        <h1 style="color: #8B5CF6; margin: 0;">${this.appName}</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Christian Content Platform</p>
        </div>
        
        <h2>Password Reset Request</h2>
        
        <p>Hello 👋!</p>
        
        <p>You requested to reset your password for your ${this.appName} account.</p>
        <p>Click the button below to reset your password:</p>
        
        <div style="text-align: center;">
        <a href="${resetUrl}" class="button">Reset Your Password</a>
        </div>
        
        <p><strong>This link will expire in 15 minutes</strong> for security reasons.</p>
        
        <p style="color: #6b7280; margin-top: 20px;">
        If you didn't request this password reset, please ignore this email. Your account remains secure.
        </p>
    
    <div class="footer">
      <p>Blessings,<br>The ${this.appName} Team</p>
      <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  private generatePasswordResetText(resetUrl: string): string {
    return `
${this.appName} - Password Reset Request

Hello 👋!

You requested to reset your password for your ${this.appName} account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes for security reasons.

If you didn't request this password reset, please ignore this email. Your account remains secure.

Blessings,
The ${this.appName} Team

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
    `;
  }

  private generateEmailVerificationCodeHtml(verificationCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #4d4d4d;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 2px solid #f0f0f0;
      margin-bottom: 30px;
    }
    .code {
      background: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 32px;
      font-weight: bold;
      color: #8B5CF6;
      border-radius: 8px;
      letter-spacing: 8px;
      margin: 30px 0;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #f0f0f0;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: #8B5CF6; margin: 0;">${this.appName}</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Verify Your Email Address</p>
    </div>
    
    <h2>Welcome to ${this.appName} 👋</h2>
    
    <p>Thank you for joining our community of faith-based writers and readers.</p>
    <p>Your verification code is:</p>
    
    <div class="code">${verificationCode}</div>
    
    <p>This code will expire in 10 minutes.</p>
    <p>Enter this code in the verification page to complete your registration.</p>
    
    <div class="footer">
      <p>Blessings,<br>The ${this.appName} Team</p>
      <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
  }

  private generateEmailVerificationCodeText(verificationCode: string): string {
    return `
${this.appName} - Email Verification

Welcome to ${this.appName} 👋

Thank you for joining our community of faith-based writers and readers.

Your verification code is:

${verificationCode}

This code will expire in 10 minutes.

Enter this code in the verification page to complete your registration.

Blessings,
The ${this.appName} Team

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.
  `;
  }

  private generateWelcomeHtml(user: any): string {
    const firstName = user.firstName || 'there';
    const dashboardUrl = `${this.frontendUrl}/dashboard`;
    const createPostUrl = `${this.frontendUrl}/create-post`;
    const exploreUrl = `${this.frontendUrl}/explore`;
    const helpUrl = `${this.frontendUrl}/help`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${this.appName}!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #4d4d4d;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      text-align: center;
      padding-bottom: 30px;
      border-bottom: 2px solid #f0f0f0;
      margin-bottom: 30px;
    }
    .welcome-icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 32px;
      background-color: #8B5CF6;
      color: white !important;
      text-decoration: none;
      border-radius: 8px;
      margin: 25px 0;
      font-weight: 600;
      text-align: center;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #7C3AED;
    }
    .feature {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin: 15px 0;
      border-left: 4px solid #8B5CF6;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 2px solid #f0f0f0;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      color: #8B5CF6;
      text-decoration: none;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="welcome-icon">✝️</div>
      <h1 style="color: #8B5CF6; margin: 0;">Welcome to ${this.appName}!</h1>
      <p style="color: #666; margin: 10px 0 0 0;">Your Christian content platform</p>
    </div>
    
    <h2>Hello ${firstName},</h2>
    
    <p>We're thrilled to welcome you to the ${this.appName} community! Your account is now fully activated and ready to use. 🙏</p>
    
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Your Dashboard</a>
    </div>
    
    <h3>What You Can Do:</h3>
    
    <div class="feature">
      <strong>📖 Read Inspiring Content</strong>
      <p>Explore faith-based articles, devotionals, and stories from Christian writers worldwide.</p>
    </div>
    
    <div class="feature">
      <strong>✍️ Share Your Faith</strong>
      <p>Create and publish your own Christian content to inspire others.</p>
    </div>
    
    <div class="feature">
      <strong>💬 Engage with Community</strong>
      <p>Like and comment on posts that resonate with you (registered users only).</p>
    </div>
    
    <div class="feature">
      <strong>🌟 Grow Spiritually</strong>
      <p>Discover new perspectives and deepen your faith through diverse Christian voices.</p>
    </div>
    
    <h3>Quick Links:</h3>
    <p>• <a href="${createPostUrl}" style="color: #8B5CF6;">Create your first post</a></p>
    <p>• <a href="${exploreUrl}" style="color: #8B5CF6;">Explore content</a></p>
    <p>• <a href="${helpUrl}" style="color: #8B5CF6;">Get help & support</a></p>
    
    <div class="footer">
      <p>"Let the word of Christ dwell in you richly..." - Colossians 3:16</p>
      
      <div class="social-links">
        <strong>Follow our ministry:</strong><br>
        <a href="#">Twitter</a> • <a href="#">Facebook</a> • <a href="#">Instagram</a>
      </div>
      
      <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
      <p>This is an automated email, please do not reply directly to this message.</p>
      <p><a href="#" style="color: #666; font-size: 12px;">Unsubscribe</a> • <a href="#" style="color: #666; font-size: 12px;">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>
  `;
  }

  private generateWelcomeText(user: any): string {
    const firstName = user.firstName || 'there';
    const dashboardUrl = `${this.frontendUrl}/dashboard`;
    const createPostUrl = `${this.frontendUrl}/create-post`;
    const exploreUrl = `${this.frontendUrl}/explore`;
    const helpUrl = `${this.frontendUrl}/help`;

    return `
✝️ WELCOME TO ${this.appName.toUpperCase()}!

Hello ${firstName},

We're thrilled to welcome you to the ${this.appName} community! Your account is now fully activated and ready to use. 🙏

GET STARTED:
${dashboardUrl}

WHAT YOU CAN DO:
📖 Read Inspiring Content - Explore faith-based articles and stories
✍️ Share Your Faith - Create and publish your own Christian content
💬 Engage with Community - Like and comment on posts (registered users)
🌟 Grow Spiritually - Discover new perspectives and deepen your faith

QUICK LINKS:
Create your first post: ${createPostUrl}
Explore content: ${exploreUrl}
Get help & support: ${helpUrl}

"Let the word of Christ dwell in you richly..." - Colossians 3:16

FOLLOW OUR MINISTRY:
Twitter: [Twitter URL]
Facebook: [Facebook URL]
Instagram: [Instagram URL]

Blessings,
The ${this.appName} Team

© ${new Date().getFullYear()} ${this.appName}. All rights reserved.

This is an automated email. Please do not reply directly to this message.

Unsubscribe: [Unsubscribe URL]
Privacy Policy: [Privacy Policy URL]
  `;
  }
}
