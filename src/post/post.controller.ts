/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { PostsService } from './post.service';
import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsDto,
  PostListResponseDto,
  SinglePostResponseDto,
  PostCreatedResponseDto,
  TagsResponseDto,
  SimplePostResponseDto,
} from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get all posts',
    description:
      'Retrieve paginated list of published posts with search and filtering capabilities',
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
    description: 'Posts per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search query for title and content',
    example: 'faith prayer',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter by tags (comma-separated)',
    example: 'faith,prayer,devotion',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort order',
    enum: ['newest', 'oldest', 'popular'],
    example: 'newest',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Posts retrieved successfully',
    type: PostListResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve posts',
  })
  @SkipThrottle()
  async getAllPosts(
    @Query() getPostsDto: GetPostsDto,
    @CurrentUser() user?: any,
  ): Promise<PostListResponseDto> {
    return this.postsService.getAllPosts(getPostsDto, user?.id);
  }

  @Get('recent')
  @UseGuards(OptionalJwtAuthGuard)
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get recent/latest posts',
    description: 'Retrieve most recently published posts (newest first)',
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
    description: 'Posts per page (default: 10)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent posts retrieved successfully',
    type: PostListResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve recent posts',
  })
  async getRecentPosts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @CurrentUser() user?: any,
  ): Promise<PostListResponseDto> {
    return this.postsService.getRecentPosts(page || 1, limit || 10, user?.id);
  }

  @Get('tags')
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get all available tags',
    description: 'Retrieve list of all unique tags from published posts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tags retrieved successfully',
    type: TagsResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve tags',
  })
  async getAllTags(): Promise<TagsResponseDto> {
    return this.postsService.getAllTags();
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @SkipThrottle()
  @ApiOperation({
    summary: 'Search posts',
    description: 'Search posts by query string',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query',
    example: 'faith and hope',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: PostListResponseDto,
  })
  async searchPosts(
    @Query('q') query: string,
    @Query() paginationDto: GetPostsDto,
    @CurrentUser() user?: any,
  ): Promise<PostListResponseDto> {
    return this.postsService.searchPosts(query, paginationDto, user?.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Get single post by slug',
    description: 'Retrieve a single published post by its URL slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Post URL slug',
    example: 'walking-in-faith-a-journey-of-trust',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post retrieved successfully',
    type: SinglePostResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve post',
  })
  @SkipThrottle()
  async getPostBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user?: any,
  ): Promise<SinglePostResponseDto> {
    return this.postsService.getPostBySlug(slug, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Create new post',
    description: 'Create a new post (requires authentication)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Post created successfully',
    type: PostCreatedResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Admin access required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate title',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to create post',
  })
  @Throttle({ short: { limit: 5, ttl: 3600000 } })
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file: Multer.File,
    @CurrentUser() user: any,
  ): Promise<PostCreatedResponseDto> {
    const userId = user.id;
    return this.postsService.createPost(createPostDto, userId, file);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update post (Admin only)',
    description: 'Update an existing post - requires admin role',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post updated successfully',
    type: PostCreatedResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'You can only edit your own posts',
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or duplicate title',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update post',
  })
  @Throttle({ short: { limit: 10, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('image'))
  async updatePost(
    @Param('id') postId: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file: Multer.File,
    @CurrentUser() user: any,
  ): Promise<PostCreatedResponseDto> {
    const userId = user.id;
    return this.postsService.updatePost(postId, updatePostDto, userId, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete post',
    description: 'Delete a post (author only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Post deleted successfully',
    type: SimplePostResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'You can only delete your own posts',
  })
  @ApiNotFoundResponse({
    description: 'Post not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to delete post',
  })
  @Throttle({ short: { limit: 5, ttl: 3600000 } })
  async deletePost(
    @Param('id') postId: string,
    @CurrentUser() user: any,
  ): Promise<SimplePostResponseDto> {
    const userId = user.id;
    return this.postsService.deletePost(postId, userId);
  }
}
