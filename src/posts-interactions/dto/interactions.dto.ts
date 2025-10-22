import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

// Request DTOs
export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'This is a very inspiring post. Thank you for sharing!',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Comment content cannot exceed 1000 characters' })
  content: string;
}

// Response DTOs
export class CommentAuthorDto {
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

  @ApiProperty({
    description: 'Author avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string | null;
}

export class CommentDataDto {
  @ApiProperty({
    description: 'Comment ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'This is a very inspiring post. Thank you for sharing!',
  })
  content: string;

  @ApiProperty({
    description: 'Comment creation date',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Comment last update date',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Comment author information',
    type: CommentAuthorDto,
  })
  author: CommentAuthorDto;
}

export class CommentResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Comment created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Comment data',
    type: CommentDataDto,
  })
  data: CommentDataDto;
}

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
    description: 'Total number of comments',
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

export class CommentsListDataDto {
  @ApiProperty({
    description: 'Array of comments',
    type: [CommentDataDto],
  })
  comments: CommentDataDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

export class CommentsListResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Comments retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Comments list data',
    type: CommentsListDataDto,
  })
  data: CommentsListDataDto;
}

export class LikeDataDto {
  @ApiProperty({
    description: 'Whether the user liked the post',
    example: true,
  })
  isLiked: boolean;

  @ApiProperty({
    description: 'Total number of likes on the post',
    example: 42,
  })
  likesCount: number;
}

export class LikeResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Post liked successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Like data',
    type: LikeDataDto,
  })
  data: LikeDataDto;
}
