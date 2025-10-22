/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsDto,
  PostResponseDto,
  PostListResponseDto,
  SinglePostResponseDto,
  PostCreatedResponseDto,
  TagsResponseDto,
  SimplePostResponseDto,
} from './dto/post.dto';
import { Multer } from 'multer';
import { FileUploadService } from 'src/upload/upload.service';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async createPost(
    createPostDto: CreatePostDto,
    userId: string,
    file?: Multer.File,
  ): Promise<PostCreatedResponseDto> {
    try {
      // Generate slug from title
      const slug = this.generateSlug(createPostDto.title);
      const uniqueSlug = await this.ensureUniqueSlug(slug);

      let featuredImageUrl = createPostDto.featuredImageFile;

      // Handle file upload if provided
      if (file) {
        featuredImageUrl = await this.uploadImage(file, userId);
      }

      const post = await this.prisma.post.create({
        data: {
          title: createPostDto.title,
          content: createPostDto.content,
          slug: uniqueSlug,
          featuredImage: featuredImageUrl,
          authorId: userId,
          allowComments: createPostDto.allowComments ?? true,
          tags: createPostDto.tags || [],
          published: createPostDto.published ?? false,
          publishedAt: createPostDto.published ? new Date() : null,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return {
        success: true,
        message: createPostDto.published
          ? 'Post published successfully'
          : 'Post saved as draft',
        post: this.formatPostResponse(post),
      };
    } catch (error) {
      this.logger.error('Create post error:', error);

      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new BadRequestException(
          'A post with similar title already exists',
        );
      }

      throw new InternalServerErrorException('Failed to create post');
    }
  }

  async searchPosts(
    query: string,
    getPostsDto: GetPostsDto,
    userId?: string,
  ): Promise<PostListResponseDto> {
    try {
      const { page = 1, limit = 10, tags, sortBy } = getPostsDto;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        published: true,
        AND: [],
      };

      // Add search condition
      if (query && query.trim()) {
        where.AND.push({
          OR: [
            { title: { contains: query.trim(), mode: 'insensitive' as const } },
            {
              content: { contains: query.trim(), mode: 'insensitive' as const },
            },
            { tags: { has: query.trim() } },
          ],
        });
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        where.AND.push({
          tags: {
            hasSome: tags,
          },
        });
      }

      // Clean up empty AND array
      if (where.AND.length === 0) {
        delete where.AND;
      }

      // Build orderBy clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'oldest':
          orderBy = { publishedAt: 'asc' };
          break;
        case 'popular':
          // For now, fallback to newest. Later implement with aggregation
          orderBy = { createdAt: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { publishedAt: 'desc' };
          break;
      }

      // Get posts with pagination
      const [posts, totalCount] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
                bio: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            ...(userId && {
              likes: {
                where: { userId },
                select: { id: true },
              },
            }),
          },
        }),
        this.prisma.post.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        message: `Found ${totalCount} post(s) matching "${query}"`,
        posts: posts.map((post) => this.formatPostResponse(post, userId)),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Search posts error:', error);
      throw new InternalServerErrorException('Failed to search posts');
    }
  }

  async getAllPosts(
    getPostsDto: GetPostsDto,
    userId?: string,
  ): Promise<PostListResponseDto> {
    try {
      const { page = 1, limit = 10, search, tags, sortBy } = getPostsDto;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        published: true, // Only show published posts publicly
      };

      // Add search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Add tags filter
      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      // Build orderBy clause
      let orderBy: any = {};
      switch (sortBy) {
        case 'oldest':
          orderBy = { publishedAt: 'asc' };
          break;
        case 'popular':
          // Order by likes count (you might want to add a computed field or use raw query for better performance)
          orderBy = { createdAt: 'desc' }; // Fallback to newest for now
          break;
        case 'newest':
        default:
          orderBy = { publishedAt: 'desc' };
          break;
      }

      // Get posts with pagination
      const [posts, totalCount] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
                bio: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
            ...(userId && {
              likes: {
                where: { userId },
                select: { id: true },
              },
            }),
          },
        }),
        this.prisma.post.count({ where }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      return {
        success: true,
        message: 'Posts retrieved successfully',
        posts: posts.map((post) => this.formatPostResponse(post, userId)),
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Get posts error:', error);
      throw new InternalServerErrorException('Failed to retrieve posts');
    }
  }

  async getPostBySlug(
    slug: string,
    userId?: string,
  ): Promise<SinglePostResponseDto> {
    try {
      const post = await this.prisma.post.findUnique({
        where: {
          slug,
          published: true, // Only allow access to published posts
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
          ...(userId && {
            likes: {
              where: { userId },
              select: { id: true },
            },
          }),
        },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return {
        success: true,
        message: 'Post retrieved successfully',
        post: this.formatPostResponse(post, userId),
      };
    } catch (error) {
      this.logger.error('Get post by slug error:', error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve post');
    }
  }

  async updatePost(
    postId: string,
    updatePostDto: UpdatePostDto,
    userId: string,
    file?: Multer.File,
  ): Promise<PostCreatedResponseDto> {
    try {
      // Check if post exists and belongs to user
      const existingPost = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          authorId: true,
          title: true,
          published: true,
          featuredImage: true,
        },
      });

      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }

      if (existingPost.authorId !== userId) {
        throw new ForbiddenException('You can only edit your own posts');
      }

      // Prepare update data
      const updateData: any = { ...updatePostDto };

      // Handle slug update if title is being changed
      if (updatePostDto.title && updatePostDto.title !== existingPost.title) {
        const newSlug = this.generateSlug(updatePostDto.title);
        updateData.slug = await this.ensureUniqueSlug(newSlug, postId);
      }

      // Handle image upload
      if (file) {
        const newImageUrl = await this.uploadImage(file, userId);
        updateData.featuredImage = newImageUrl;

        // Delete old image if exists
        if (existingPost.featuredImage) {
          await this.deleteImage(existingPost.featuredImage);
        }
      }

      // Handle publication status change
      if (updatePostDto.published !== undefined) {
        if (updatePostDto.published && !existingPost.published) {
          // Publishing for the first time
          updateData.publishedAt = new Date();
        } else if (!updatePostDto.published && existingPost.published) {
          // Unpublishing
          updateData.publishedAt = null;
        }
      }

      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Post updated successfully',
        post: this.formatPostResponse(updatedPost),
      };
    } catch (error) {
      this.logger.error('Update post error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      if (error.code === 'P2002' && error.meta?.target?.includes('slug')) {
        throw new BadRequestException(
          'A post with similar title already exists',
        );
      }

      throw new InternalServerErrorException('Failed to update post');
    }
  }

  async deletePost(
    postId: string,
    userId: string,
  ): Promise<SimplePostResponseDto> {
    try {
      // Check if post exists and belongs to user
      const existingPost = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!existingPost) {
        throw new NotFoundException('Post not found');
      }

      if (existingPost.authorId !== userId) {
        throw new ForbiddenException('You can only delete your own posts');
      }

      // Delete the post (this will cascade delete comments and likes)
      await this.prisma.post.delete({
        where: { id: postId },
      });

      return {
        success: true,
        message: 'Post deleted successfully',
      };
    } catch (error) {
      this.logger.error('Delete post error:', error);

      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete post');
    }
  }

  async getAllTags(): Promise<TagsResponseDto> {
    try {
      // Get all unique tags from published posts
      const posts = await this.prisma.post.findMany({
        where: {
          published: true,
          tags: { isEmpty: false },
        },
        select: { tags: true },
      });

      // Flatten and deduplicate tags
      const allTags = posts.flatMap((post) => post.tags);
      const uniqueTags = [...new Set(allTags)].sort();

      return {
        success: true,
        message: 'Tags retrieved successfully',
        tags: uniqueTags,
      };
    } catch (error) {
      this.logger.error('Get tags error:', error);
      throw new InternalServerErrorException('Failed to retrieve tags');
    }
  }

  // Helper methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  private async ensureUniqueSlug(
    baseSlug: string,
    excludePostId?: string,
  ): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.prisma.post.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludePostId) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  private async uploadImage(
    file: Multer.File,
    userId: string,
  ): Promise<string> {
    try {
      // Define folder structure for organization
      const folder = `posts/${userId}`;

      // Upload options
      const options = {
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxFileSize: 10 * 1024 * 1024,
        transformation: [
          {
            width: 1200,
            height: 630,
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
      };

      return await this.fileUploadService.uploadFile(file, folder, options);
    } catch (error) {
      this.logger.error('Image upload error:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  private async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        await this.fileUploadService.deleteFile(publicId);
      }
    } catch (error) {
      // Log but don't throw - image deletion failure shouldn't block operations
      this.logger.warn('Failed to delete image:', error);
    }
  }

  // Extract public_id from Cloudinary URL
  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{ext}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  // Update formatPostResponse to include featuredImage
  private formatPostResponse(post: any, userId?: string): PostResponseDto {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug,
      featuredImage: post.featuredImage,
      author: {
        id: post.author.id,
        fullName: post.author.fullName,
        avatar: post.author.avatar,
        bio: post.author.bio,
      },
      allowComments: post.allowComments,
      tags: post.tags,
      published: post.published,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likesCount: post._count?.likes || 0,
      commentsCount: post._count?.comments || 0,
      isLiked: userId ? post.likes?.length > 0 : undefined,
    };
  }
}
