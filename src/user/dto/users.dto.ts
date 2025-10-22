import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

// Request DTOs
export class UpdateProfileDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar?: string | null;

  @ApiProperty({
    description: 'User bio/description',
    example: 'Passionate writer sharing faith-based content',
    required: false,
    nullable: true,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string | null;

  @ApiProperty({
    description: 'User preferred tags for content recommendations',
    example: ['faith', 'prayer', 'devotion'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: 'Cannot have more than 20 preferred tags' })
  tags?: string[];
}

// Response DTOs
export class UserProfileDataDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({
    description: 'User bio/description',
    example: 'Passionate writer sharing faith-based content',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Date when user joined',
    example: '2024-01-15T10:30:00.000Z',
  })
  joinedAt: Date;

  @ApiProperty({
    description: 'Number of published posts',
    example: 15,
  })
  postsCount: number;
}

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'User profile retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User profile data',
    type: UserProfileDataDto,
  })
  data: UserProfileDataDto;
}

export class ProfileUpdateDataDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string | null;

  @ApiProperty({
    description: 'User bio/description',
    example: 'Passionate writer sharing faith-based content',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    description: 'Profile last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class ProfileUpdateResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Profile updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated profile data',
    type: ProfileUpdateDataDto,
  })
  data: ProfileUpdateDataDto;
}

export class UserAuthorDto {
  @ApiProperty({
    description: 'Author ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'Author full name',
    example: 'John Doe',
  })
  fullName: string;
}

export class UserPostDto {
  @ApiProperty({
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'Post title',
    example: 'Walking in Faith: A Journey of Trust',
  })
  title: string;

  @ApiProperty({
    description: 'Post URL slug',
    example: 'walking-in-faith-a-journey-of-trust',
  })
  slug: string;

  @ApiProperty({
    description: 'Post excerpt (first 200 characters)',
    example:
      "Faith is not just a belief system; it's a way of life that transforms our daily experiences. In this post, we explore how walking in faith can change our perspective on challenges and...",
  })
  excerpt: string;

  @ApiProperty({
    description: 'Post tags',
    example: ['faith', 'trust', 'christian-living'],
    type: [String],
  })
  tags: string[];

  @ApiProperty({
    description: 'Post publication date',
    example: '2024-01-15T10:30:00.000Z',
    nullable: true,
  })
  publishedAt: Date | null;

  @ApiProperty({
    description: 'Post creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Number of likes',
    example: 42,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Number of comments',
    example: 8,
  })
  commentsCount: number;
}

// Reuse pagination DTO from interactions
export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 47,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrevPage: boolean;
}

export class UserPostsDataDto {
  @ApiProperty({
    description: 'Author information',
    type: UserAuthorDto,
  })
  author: UserAuthorDto;

  @ApiProperty({
    description: 'Array of user posts',
    type: [UserPostDto],
  })
  posts: UserPostDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: () => PaginationDto,
  })
  pagination: PaginationDto;
}

export class UserPostsResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'User posts retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User posts data',
    type: UserPostsDataDto,
  })
  data: UserPostsDataDto;
}

export class CurrentUserStatsDto {
  @ApiProperty({ description: 'Number of published posts' })
  postsCount: number;

  @ApiProperty({ description: 'Number of comments made' })
  commentsCount: number;

  @ApiProperty({ description: 'Number of likes given' })
  likesGiven: number;
}

export class CurrentUserPreferencesDto {
  @ApiProperty({ description: 'Preferred content tags', type: [String] })
  tags: string[];
}

export class CurrentUserDataDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatar: string | null;

  @ApiProperty({ description: 'Bio', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Join date' })
  joinedAt: Date;

  @ApiProperty({ description: 'Email verified status' })
  isVerified: boolean;

  @ApiProperty({ description: 'Has Google authentication linked' })
  hasGoogleAuth: boolean;

  @ApiProperty({
    description: 'User preferences',
    type: CurrentUserPreferencesDto,
  })
  preferences: CurrentUserPreferencesDto;

  @ApiProperty({ description: 'User statistics', type: CurrentUserStatsDto })
  stats: CurrentUserStatsDto;
}

export class CurrentUserProfileResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Current user data', type: CurrentUserDataDto })
  data: CurrentUserDataDto;
}
