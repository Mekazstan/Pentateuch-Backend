import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ExploreQueryDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    required: false,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by specific tags',
    example: ['faith', 'prayer'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map((tag) => tag.trim());
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

// explore/dto/explore-response.dto.ts
export class PostSummaryDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content excerpt' })
  excerpt: string;

  @ApiProperty({ description: 'Post slug for URL' })
  slug: string;

  @ApiProperty({ description: 'Post tags' })
  tags: string[];

  @ApiProperty({ description: 'Publication date' })
  publishedAt: Date;

  @ApiProperty({ description: 'Author information' })
  author: {
    id: string;
    fullName: string;
    avatar?: string;
  };

  @ApiProperty({ description: 'Engagement metrics' })
  stats: {
    likesCount: number;
    commentsCount: number;
  };
}

export class ExploreResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({
    description: 'List of recommended posts',
    type: [PostSummaryDto],
  })
  posts: PostSummaryDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Available tags for filtering',
    type: [String],
  })
  availableTags: string[];
}
