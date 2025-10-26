import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  Min,
  Max,
  MaxLength,
  MinLength,
  IsNumber,
  IsUrl,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AuthorDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ example: 'Faith blogger and writer' })
  bio?: string;
}

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'A Love Letter To Abba',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description:
      'Post content - HTML body only (no <html>, <head>, or <body> tags)',
    example: '<h1>Title</h1><p>I thought I was alone...</p>',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Featured image URL (from /posts/image endpoint)',
    example: 'https://res.cloudinary.com/your-cloud/image/upload/...',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Allow comments on this post',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Post tags for categorization',
    example: ['faith', 'love', 'prayer'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Publish immediately',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Post title',
    example: 'Updated Title',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Post content in HTML format',
    example: '<p>Updated content...</p>',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'Featured image URL (from /posts/image endpoint)',
    example: 'https://res.cloudinary.com/your-cloud/image/upload/...',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Allow comments on this post',
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Post tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Publish status',
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UploadImageDto {
  @ApiProperty({
    description: 'Base64 encoded image string',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  image: string;
}

export class GetPostsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 10,
    default: 10,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Search query',
    example: 'faith and hope',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'faith,prayer,love',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map((tag) => tag.trim())
      : value,
  )
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['newest', 'oldest', 'popular'],
    example: 'newest',
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'oldest' | 'popular';
}

export class AuthorResponseDto {
  @ApiProperty({ description: 'Author ID' })
  id: string;

  @ApiProperty({ description: 'Author full name' })
  fullName: string;

  @ApiProperty({ description: 'Author avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Author bio', required: false })
  bio?: string;
}

export class PostResponseDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'A Love Letter To Abba' })
  title: string;

  @ApiProperty({
    description: 'Full HTML content of the post',
    example: '<p>I thought I was alone...</p><p>Until I met You.</p>',
  })
  content: string;

  @ApiProperty({ example: 'a-love-letter-to-abba' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://example.com/featured.jpg' })
  featuredImage?: string;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ example: true })
  allowComments: boolean;

  @ApiProperty({ example: ['faith', 'love', 'prayer'], type: [String] })
  tags: string[];

  @ApiProperty({ example: true })
  published: boolean;

  @ApiProperty({ example: '2024-10-24T10:00:00Z' })
  publishedAt: Date;

  @ApiProperty({ example: '2024-10-24T09:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-10-24T11:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 15 })
  commentsCount: number;

  @ApiPropertyOptional({
    description:
      'Whether the current user has liked this post (only for authenticated users)',
    example: true,
  })
  isLiked: boolean;
}

export class PaginationDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;
}

export class PostListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Posts retrieved successfully' })
  message: string;

  @ApiProperty({ type: [PostResponseDto] })
  posts: PostResponseDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}

export class SinglePostResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Post retrieved successfully' })
  message: string;

  @ApiProperty({ type: PostResponseDto })
  post: PostResponseDto;
}

export class PostCreatedResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Post created successfully' })
  message: string;

  @ApiProperty({ type: PostResponseDto })
  post: PostResponseDto;
}

export class TagsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Tags retrieved successfully' })
  message: string;

  @ApiProperty({
    description: 'All available tags from user-created posts',
    example: ['faith', 'prayer', 'love', 'hope'],
    type: [String],
  })
  tags: string[];
}

export class SimplePostResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Post deleted successfully' })
  message: string;
}
