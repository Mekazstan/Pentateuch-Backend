/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PostsInteractionsService } from './posts-interactions.service';
import {
  CreateCommentDto,
  CommentResponseDto,
  CommentsListResponseDto,
  LikeResponseDto,
} from './dto/interactions.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';

@ApiTags('Post Interactions')
@Controller('posts')
export class PostsInteractionsController {
  constructor(
    private readonly postsInteractionsService: PostsInteractionsService,
  ) {}

  @Post(':id/like')
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Like/Unlike post',
    description: 'Toggle like status for a post (authenticated users only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to toggle like',
  })
  async toggleLike(
    @Param('id') postId: string,
    @CurrentUser() user: any,
  ): Promise<LikeResponseDto> {
    const userId = user.id;
    return this.postsInteractionsService.toggleLike(postId, userId);
  }

  @Get(':id/comments')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get post comments',
    description: 'Retrieve paginated comments for a specific post',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Comments per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comments retrieved successfully',
    type: CommentsListResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve comments',
  })
  async getComments(
    @Param('id') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ): Promise<CommentsListResponseDto> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    return this.postsInteractionsService.getComments(postId, pageNum, limitNum);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ short: { limit: 3, ttl: 60000 } })
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Add comment to post',
    description: 'Create a new comment on a post (authenticated users only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or comments disabled for this post',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create comment',
  })
  async createComment(
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: any,
  ): Promise<CommentResponseDto> {
    const userId = user.id;
    return this.postsInteractionsService.createComment(
      postId,
      createCommentDto,
      userId,
    );
  }

  @Delete('comments/:commentId')
  @Throttle({ short: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete comment',
    description: 'Delete a comment (author only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Comment ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comment deleted successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'You can only delete your own comments',
  })
  @ApiNotFoundResponse({
    description: 'Comment not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete comment',
  })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const userId = user.id;
    return this.postsInteractionsService.deleteComment(commentId, userId);
  }
}
