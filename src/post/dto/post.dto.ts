import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post title',
    example: 'Walking in Faith: A Journey of Trust',
  })
  @Sanitize()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Post content in markdown or plain text',
    example: 'In times of uncertainty, faith becomes our anchor...',
  })
  @Sanitize()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Whether to allow comments on this post',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for content categorization',
    example: ['faith', 'prayer', 'devotion', 'testimony'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Whether to publish immediately or save as draft',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Featured image file',
  })
  @IsOptional()
  featuredImageFile?: any;
}

export class UpdatePostDto {
  @ApiPropertyOptional({
    description: 'Post title',
    example: 'Walking in Faith: A Journey of Trust (Updated)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({
    description: 'Post content',
    example: 'Updated content...',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether to allow comments on this post',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for content categorization',
    example: ['faith', 'prayer', 'updated'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Publication status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class GetPostsDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of posts per page',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Search query for title and content',
    example: 'faith prayer',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'faith,prayer,devotion',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    value ? value.split(',').map((tag: string) => tag.trim()) : undefined,
  )
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'newest',
    enum: ['newest', 'oldest', 'popular'],
  })
  @IsOptional()
  @IsString()
  sortBy?: 'newest' | 'oldest' | 'popular' = 'newest';
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
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Post URL slug' })
  slug: string;

  @ApiProperty({ description: 'Author information', type: AuthorResponseDto })
  author: AuthorResponseDto;

  @ApiProperty({ description: 'Whether comments are allowed' })
  allowComments: boolean;

  @ApiProperty({ description: 'Post tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Publication status' })
  published: boolean;

  @ApiProperty({ description: 'Publication date', required: false })
  publishedAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Number of likes' })
  likesCount: number;

  @ApiProperty({ description: 'Number of comments' })
  commentsCount: number;

  @ApiProperty({
    description: 'Whether current user liked this post',
    required: false,
  })
  isLiked?: boolean;

  @ApiProperty({
    description: 'Featured image URL',
    nullable: true,
  })
  featuredImage?: string | null;
}

export class PostListResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'List of posts', type: [PostResponseDto] })
  posts: PostResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class SinglePostResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Post data', type: PostResponseDto })
  post: PostResponseDto;
}

export class PostCreatedResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Created post data', type: PostResponseDto })
  post: PostResponseDto;
}

export class TagsResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'List of available tags', type: [String] })
  tags: string[];
}

export class SimplePostResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;
}
