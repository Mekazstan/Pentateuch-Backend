import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  Min,
  Max,
  IsArray,
  IsString,
  IsNumber,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AuthorDto, PaginationDto } from 'src/post/dto/post.dto';

export class ExploreQueryDto {
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
    description: 'Filter by tags (comma-separated)',
    example: 'faith,prayer,devotion',
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
}

export class PostStatsDto {
  @ApiProperty({ example: 42 })
  likesCount: number;

  @ApiProperty({ example: 15 })
  commentsCount: number;
}

export class PostSummaryDto {
  @ApiProperty({ example: 'clxxxxxxxxxxxxxx' })
  id: string;

  @ApiProperty({ example: 'A Love Letter To Abba' })
  title: string;

  @ApiProperty({
    description: 'Plain text excerpt (first 150 characters)',
    example: 'I thought I was alone. I thought I was neglected...',
  })
  excerpt: string;

  @ApiPropertyOptional({
    description: 'Full HTML content of the post',
    example: '<p>I thought I was alone...</p>',
  })
  content?: string;

  @ApiProperty({ example: 'a-love-letter-to-abba' })
  slug: string;

  @ApiProperty({ example: ['faith', 'love'], type: [String] })
  tags: string[];

  @ApiPropertyOptional({ example: 'https://example.com/featured.jpg' })
  featuredImage?: string;

  @ApiProperty({ example: '2024-10-24T10:00:00Z' })
  publishedAt: Date;

  @ApiProperty({ type: AuthorDto })
  author: AuthorDto;

  @ApiProperty({ type: PostStatsDto })
  stats: PostStatsDto;

  @ApiPropertyOptional({
    description: 'Whether the current user has liked this post',
    example: true,
  })
  isLiked?: boolean;
}

export class ExploreResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Featured content retrieved successfully' })
  message: string;

  @ApiProperty({ type: [PostSummaryDto] })
  posts: PostSummaryDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({
    description: 'Available tags for filtering',
    example: ['faith', 'prayer', 'love'],
    type: [String],
  })
  availableTags: string[];
}
