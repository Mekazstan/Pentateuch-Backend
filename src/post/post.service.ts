/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { FileUploadService } from 'src/upload/upload.service';
import { Prisma } from '@prisma/client';

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
  ): Promise<PostCreatedResponseDto> {
    try {
      // Generate slug from title
      const slug = this.generateSlug(createPostDto.title);
      const uniqueSlug = await this.ensureUniqueSlug(slug);

      // Sanitize HTML content (remove full document tags if present)
      const sanitizedContent = this.sanitizeHtmlContent(createPostDto.content);

      const post = await this.prisma.post.create({
        data: {
          title: createPostDto.title,
          content: sanitizedContent,
          slug: uniqueSlug,
          featuredImage: createPostDto.featuredImage,
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

      const where: any = {
        published: true,
        AND: [],
      };

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

      if (tags && tags.length > 0) {
        where.AND.push({
          tags: { hasSome: tags },
        });
      }

      if (where.AND.length === 0) {
        delete where.AND;
      }

      let orderBy: any = {};
      switch (sortBy) {
        case 'oldest':
          orderBy = { publishedAt: 'asc' };
          break;
        case 'popular':
          orderBy = { createdAt: 'desc' };
          break;
        case 'newest':
        default:
          orderBy = { publishedAt: 'desc' };
          break;
      }

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

  async getRecentPosts(
    page = 1,
    limit = 10,
    userId?: string,
  ): Promise<PostListResponseDto> {
    try {
      const skip = (page - 1) * limit;

      const where = {
        published: true,
        publishedAt: { not: null },
      };

      const [posts, totalCount] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { publishedAt: 'desc' }, // Most recent first
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
        message: 'Recent posts retrieved successfully',
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
      this.logger.error('Get recent posts error:', error);
      throw new InternalServerErrorException('Failed to retrieve recent posts');
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
        published: true,
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
          // For popular, use raw query with engagement calculation
          return this.getPopularPosts(getPostsDto, userId);
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
            likes: userId
              ? {
                  where: { userId },
                  select: { id: true },
                }
              : false,
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
          published: true,
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
      const updateData: any = {};

      // Handle slug update if title is being changed
      if (updatePostDto.title && updatePostDto.title !== existingPost.title) {
        updateData.title = updatePostDto.title;
        const newSlug = this.generateSlug(updatePostDto.title);
        updateData.slug = await this.ensureUniqueSlug(newSlug, postId);
      }

      // Update content if provided
      if (updatePostDto.content) {
        updateData.content = this.sanitizeHtmlContent(updatePostDto.content);
      }

      // Update featured image if provided
      if (updatePostDto.featuredImage) {
        // Delete old image if exists and is different
        if (
          existingPost.featuredImage &&
          existingPost.featuredImage !== updatePostDto.featuredImage
        ) {
          await this.deleteImage(existingPost.featuredImage);
        }
        updateData.featuredImage = updatePostDto.featuredImage;
      }

      // Update other fields
      if (updatePostDto.allowComments !== undefined) {
        updateData.allowComments = updatePostDto.allowComments;
      }

      if (updatePostDto.tags) {
        updateData.tags = updatePostDto.tags;
      }

      // Handle publication status change
      if (updatePostDto.published !== undefined) {
        updateData.published = updatePostDto.published;
        if (updatePostDto.published && !existingPost.published) {
          updateData.publishedAt = new Date();
        } else if (!updatePostDto.published && existingPost.published) {
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
      const posts = await this.prisma.post.findMany({
        where: {
          published: true,
          tags: { isEmpty: false },
        },
        select: { tags: true },
      });

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
  private async getPopularPosts(
    getPostsDto: GetPostsDto,
    userId?: string,
  ): Promise<PostListResponseDto> {
    const { page = 1, limit = 10, search, tags } = getPostsDto;
    const skip = (page - 1) * limit;

    let whereClause = Prisma.sql`WHERE p.published = true AND p."publishedAt" IS NOT NULL`;

    // Add search filter
    if (search) {
      whereClause = Prisma.sql`${whereClause} AND (
        p.title ILIKE ${'%' + search + '%'} OR 
        p.content ILIKE ${'%' + search + '%'}
      )`;
    }

    // Add tags filter
    if (tags && tags.length > 0) {
      whereClause = Prisma.sql`${whereClause} AND p.tags && ${tags}::text[]`;
    }

    const posts: any[] = await this.prisma.$queryRaw`
      SELECT 
        p.id, p.title, p.content, p.slug, p.tags, p."featuredImage",
        p."publishedAt", p."createdAt", p."updatedAt",
        p."allowComments", p.published,
        json_build_object(
          'id', u.id, 'fullName', u."fullName", 
          'avatar', u.avatar, 'bio', u.bio
        ) as author,
        COALESCE(COUNT(DISTINCT l.id), 0)::int as "likesCount",
        COALESCE(COUNT(DISTINCT c.id), 0)::int as "commentsCount",
        (COALESCE(COUNT(DISTINCT l.id), 0) * 2 + COALESCE(COUNT(DISTINCT c.id), 0)) as engagement_score,
        CASE 
          WHEN ${userId || null} IS NULL THEN false
          ELSE EXISTS(
            SELECT 1 FROM likes 
            WHERE likes."postId" = p.id 
            AND likes."userId" = ${userId || null}
          )
        END as "isLiked"
      FROM posts p
      INNER JOIN users u ON u.id = p."authorId"
      LEFT JOIN likes l ON l."postId" = p.id
      LEFT JOIN comments c ON c."postId" = p.id
      ${whereClause}
      GROUP BY p.id, u.id
      ORDER BY engagement_score DESC, p."publishedAt" DESC
      LIMIT ${limit}
      OFFSET ${skip}
    `;

    const countResult: any[] = await this.prisma.$queryRaw`
      SELECT COUNT(*)::int as total FROM posts p ${whereClause}
    `;
    const totalCount = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      message: 'Popular posts retrieved successfully',
      posts: posts.map((post) => this.formatPostResponseFromRaw(post, userId)),
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

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

  private async deleteImage(imageUrl: string): Promise<void> {
    try {
      const publicId = this.extractPublicIdFromUrl(imageUrl);
      if (publicId) {
        await this.fileUploadService.deleteFile(publicId);
      }
    } catch (error) {
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
    let isLiked = false;

    if (userId && post.likes) {
      isLiked = post.likes.length > 0;
    }
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
      isLiked,
    };
  }

  private formatPostResponseFromRaw(
    post: any,
    userId?: string,
  ): PostResponseDto {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug,
      featuredImage: post.featuredImage || undefined,
      author: post.author,
      allowComments: post.allowComments,
      tags: post.tags,
      published: post.published,
      publishedAt: new Date(post.publishedAt),
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt),
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      isLiked: Boolean(post.isLiked),
    };
  }

  private sanitizeHtmlContent(content: string): string {
    let sanitized = content;

    // Remove DOCTYPE
    sanitized = sanitized.replace(/<!DOCTYPE[^>]*>/gi, '');

    // Extract body content if full HTML document
    const bodyMatch = sanitized.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      sanitized = bodyMatch[1];
    }

    // Remove html and head tags
    sanitized = sanitized.replace(/<\/?html[^>]*>/gi, '');
    sanitized = sanitized.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    sanitized = sanitized.replace(/<\/?body[^>]*>/gi, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }
}
