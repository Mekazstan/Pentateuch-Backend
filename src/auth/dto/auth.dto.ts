import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'David Mike',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'dave.mike@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Preferred content tags for recommendations',
    example: ['faith', 'prayer', 'devotion'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class VerifyEmailDto {
  @ApiProperty({
    description: '4-digit verification code sent to your email',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  verificationCode: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'dave.mike@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google access token',
    example: 'ya29.a0AfH6SMB...',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    description: 'Preferred content tags for recommendations (for new users)',
    example: ['faith', 'prayer', 'devotion'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class ResendCodeDto {
  @ApiProperty({
    description: 'User email address',
    example: 'dave.mike@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User email address',
    example: 'dave.mike@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: '6-digit password reset code sent to your email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  resetCode: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User full name', required: false })
  fullName?: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ enum: ['USER', 'ADMIN'] })
  role: string;

  @ApiProperty({ description: 'Email verification status' })
  isVerified: boolean;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'User bio', required: false })
  bio?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'User information', type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({
    description: 'Whether user is new (for Google OAuth)',
    required: false,
  })
  isNewUser?: boolean;
}

export class SimpleResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    required: false,
  })
  expiresIn?: number;
}
