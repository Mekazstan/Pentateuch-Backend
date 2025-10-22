/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import {
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  GoogleAuthDto,
  ResendCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  SimpleResponseDto,
  UserResponseDto,
} from './dto/auth.dto';

// You'll need to install and configure this
import { OAuth2Client } from 'google-auth-library';

interface GoogleUserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email_verified: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const normalizedEmail = registerDto.email.toLowerCase();

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(
        registerDto.password,
        saltRounds,
      );

      // Create user with transaction for data consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: registerDto.fullName,
            password: hashedPassword,
            isVerified: false,
          },
        });

        // Create user preferences if tags are provided
        if (registerDto.tags && registerDto.tags.length > 0) {
          await tx.userPreference.create({
            data: {
              userId: user.id,
              tags: registerDto.tags,
            },
          });
        }

        return user;
      });

      // Send verification email
      await this.sendVerificationEmailAsync(result.email);

      // Generate tokens
      const tokens = await this.generateTokens(result);

      return {
        success: true,
        message: 'Account created successfully. Please verify your email.',
        user: this.formatUserResponse(result),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      this.logger.error('Registration error:', error);

      if (error instanceof ConflictException) {
        throw error;
      }

      if (error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }

      throw new InternalServerErrorException('Failed to create account');
    }
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<AuthResponseDto> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Find the most recent verification code for this email
        const verification = await tx.emailVerification.findFirst({
          where: {
            email: verifyEmailDto.email.toLowerCase(),
            verificationCode: verifyEmailDto.verificationCode,
            verifiedAt: null,
            expiresAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!verification) {
          throw new BadRequestException('Invalid or expired verification code');
        }

        // Get user
        const user = await tx.user.findUnique({
          where: { email: verifyEmailDto.email.toLowerCase() },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        if (user.isVerified) {
          throw new BadRequestException('Email already verified');
        }

        // Update user verification status
        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { isVerified: true },
        });

        // Mark verification as used
        await tx.emailVerification.update({
          where: { id: verification.id },
          data: { verifiedAt: new Date() },
        });

        return updatedUser;
      });

      // Generate new tokens
      const tokens = await this.generateTokens(result);

      return {
        success: true,
        message: 'Email verified successfully',
        user: this.formatUserResponse(result),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      this.logger.error('Email verification error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const normalizedEmail = loginDto.email.toLowerCase();

    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          preferences: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user has a password (not a Google OAuth user)
      if (!user.password) {
        throw new UnauthorizedException(
          'Please use Google sign-in for this account',
        );
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        message: 'Login successful',
        user: this.formatUserResponse(user),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
      };
    } catch (error) {
      this.logger.error('Login error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Login failed. Please try again.');
    }
  }

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    try {
      // Verify Google token and get user info
      const googleUser = await this.verifyGoogleToken(
        googleAuthDto.accessToken,
      );

      if (!googleUser) {
        throw new UnauthorizedException('Invalid Google token');
      }

      // Check if user exists
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [{ email: googleUser.email }, { googleId: googleUser.sub }],
        },
        include: {
          preferences: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        const result = await this.prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: googleUser.email,
              fullName: this.getFullNameFromGoogle(googleUser),
              googleId: googleUser.sub,
              isVerified: googleUser.email_verified,
              avatar: googleUser.picture,
              password: null, // Google OAuth users don't have passwords
            },
          });

          // Create preferences if tags provided
          if (googleAuthDto.tags && googleAuthDto.tags.length > 0) {
            await tx.userPreference.create({
              data: {
                userId: newUser.id,
                tags: googleAuthDto.tags,
              },
            });
          }

          // Return user with preferences included
          return await tx.user.findUnique({
            where: { id: newUser.id },
            include: {
              preferences: true,
            },
          });
        });

        user = result;
      } else {
        // Update existing user's Google info if needed
        if (!user.googleId || user.avatar !== googleUser.picture) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              googleId: googleUser.sub,
              avatar: googleUser.picture || user.avatar,
              isVerified: googleUser.email_verified || user.isVerified,
            },
            include: {
              preferences: true,
            },
          });
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        message: isNewUser
          ? 'Account created successfully'
          : 'Login successful',
        user: this.formatUserResponse(user),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
        isNewUser,
      };
    } catch (error) {
      this.logger.error('Google auth error:', error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new InternalServerErrorException('Google authentication failed');
    }
  }

  async resendCode(resendCodeDto: ResendCodeDto): Promise<SimpleResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: resendCodeDto.email.toLowerCase() },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.isVerified) {
        throw new BadRequestException('Email already verified');
      }

      // Send verification email
      await this.sendVerificationEmail(resendCodeDto.email);

      return {
        success: true,
        message: 'Verification code sent to your email',
        expiresIn: 600, // 10 minutes
      };
    } catch (error) {
      this.logger.error('Resend code error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to send verification code',
      );
    }
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SimpleResponseDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: forgotPasswordDto.email.toLowerCase() },
      });

      // Don't reveal if user exists or not for security
      if (user && user.password) {
        // Only send reset code if user has a password (not Google OAuth user)
        const resetCode = this.generateResetCode();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Store reset code in database
        await this.prisma.passwordReset.create({
          data: {
            email: user.email,
            resetCode,
            expiresAt,
          },
        });

        // Send email
        await this.emailService.sendPasswordResetEmail(user.email, resetCode);
      }

      return {
        success: true,
        message:
          'If an account exists with this email, a password reset code has been sent',
        expiresIn: 900, // 15 minutes
      };
    } catch (error) {
      this.logger.error('Forgot password error:', error);
      throw new InternalServerErrorException('Failed to send reset code');
    }
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<SimpleResponseDto> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Find valid reset code
        const passwordReset = await tx.passwordReset.findFirst({
          where: {
            email: resetPasswordDto.email.toLowerCase(),
            resetCode: resetPasswordDto.resetCode,
            usedAt: null,
            expiresAt: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!passwordReset) {
          throw new BadRequestException('Invalid or expired reset code');
        }

        // Find user
        const user = await tx.user.findUnique({
          where: { email: resetPasswordDto.email.toLowerCase() },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(
          resetPasswordDto.password,
          saltRounds,
        );

        // Update password
        await tx.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });

        // Mark reset code as used
        await tx.passwordReset.update({
          where: { id: passwordReset.id },
          data: { usedAt: new Date() },
        });

        return user;
      });

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error('Reset password error:', error);

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  // Private helper methods
  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private formatUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      isVerified: user.isVerified,
      avatar: user.avatar,
      bio: user.bio,
    };
  }

  private async sendVerificationEmailAsync(email: string): Promise<void> {
    try {
      await this.sendVerificationEmail(email);
    } catch (error) {
      // Log but don't throw - we don't want email failures to affect user creation
      this.logger.warn('Failed to send verification email:', error);
    }
  }

  private async sendVerificationEmail(email: string): Promise<void> {
    // Generate 4-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await this.prisma.emailVerification.create({
      data: {
        email: email.toLowerCase(),
        verificationCode,
        expiresAt,
      },
    });

    // Send email
    await this.emailService.sendEmailVerificationCode(email, verificationCode);
  }

  private generateResetCode(): string {
    // Generate 6-digit reset code
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async verifyGoogleToken(
    token: string,
  ): Promise<GoogleUserInfo | null> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return null;
      }

      return {
        sub: payload.sub,
        email: payload.email!,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        email_verified: payload.email_verified || false,
      };
    } catch (error) {
      this.logger.error('Google token verification failed:', error);
      return null;
    }
  }

  private getFullNameFromGoogle(googleUser: GoogleUserInfo): string {
    if (googleUser.given_name && googleUser.family_name) {
      return `${googleUser.given_name} ${googleUser.family_name}`;
    }
    if (googleUser.given_name) {
      return googleUser.given_name;
    }
    // Fallback to email prefix if no name provided
    return googleUser.email.split('@')[0];
  }
}
