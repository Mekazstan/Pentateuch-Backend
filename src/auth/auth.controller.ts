/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, Body, Ip, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  GoogleAuthDto,
  ResendCodeDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AuthResponseDto,
  SimpleResponseDto,
} from './dto/auth.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Create new user account',
    description: 'Register a new user account with email and password',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully',
    type: AuthResponseDto,
  })
  @ApiConflictResponse({
    description: 'Email already registered',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create account',
  })
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify email with code',
    description:
      'Verify your email address using the 4-digit code sent to your email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired verification code',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to verify email',
  })
  @Throttle({ short: { limit: 10, ttl: 3600000 } })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<AuthResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'User login with email and password',
    description: 'Authenticate user with email and password credentials',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or account issues',
  })
  @ApiInternalServerErrorResponse({
    description: 'Login failed',
  })
  @Throttle({ short: { limit: 5, ttl: 300000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
  ): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @ApiOperation({
    summary: 'Google OAuth authentication',
    description: 'Sign in or sign up using Google OAuth access token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google authentication successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid Google token',
  })
  @ApiInternalServerErrorResponse({
    description: 'Google authentication failed',
  })
  @Throttle({ short: { limit: 10, ttl: 3600000 } })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Ip() ipAddress: string,
  ): Promise<AuthResponseDto> {
    return this.authService.googleAuth(googleAuthDto);
  }

  @Post('resend-code')
  @ApiOperation({
    summary: 'Resend verification code',
    description: 'Resend 4-digit verification code to user email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification code sent successfully',
    type: SimpleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiBadRequestResponse({
    description: 'Email already verified',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to send verification code',
  })
  @Throttle({ short: { limit: 3, ttl: 600000 } })
  async resendCode(
    @Body() resendCodeDto: ResendCodeDto,
  ): Promise<SimpleResponseDto> {
    return this.authService.resendCode(resendCodeDto);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Initiate password reset',
    description: 'Send 6-digit password reset code to user email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset code sent to email',
    type: SimpleResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to send reset code',
  })
  @Throttle({ short: { limit: 3, ttl: 3600000 } })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<SimpleResponseDto> {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with code',
    description:
      'Reset your password using the 6-digit code sent to your email',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    type: SimpleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid or expired reset code',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to reset password',
  })
  @Throttle({ short: { limit: 5, ttl: 3600000 } })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<SimpleResponseDto> {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
