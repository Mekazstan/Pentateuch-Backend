/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExploreQueryDto,
  ExploreResponseDto,
  PostSummaryDto,
} from './dto/explore-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get featured/recommended content with random ordering
   * This replaces the engagement-based sorting with randomization
   */
  async getRecommendedContent(
    query: ExploreQueryDto,
    userId?: string,
  ): Promise<ExploreResponseDto> {
    try {
      const { page = 1, limit = 10, tags } = query;
      const skip = (page - 1) * limit;

      this.logger.log(
        `Fetching featured content - Page: ${page}, Limit: ${limit}, Tags: ${tags?.join(',') || 'none'}, UserId: ${userId || 'anonymous'}`,
      );

      // Load user preferences if authenticated
      let userPreferences: string[] = [];
      if (userId) {
        try {
          const preferences = await this.prisma.userPreference.findUnique({
            where: { userId },
            select: { tags: true },
          });
          userPreferences = preferences?.tags || [];
          this.logger.log(
            `User preferences loaded: ${userPreferences.join(',')}`,
          );
        } catch (error) {
          this.logger.warn(`Failed to load user preferences: ${error.message}`);
        }
      }

      // Determine which tags to use for filtering
      let filterTags: string[] | null = null;
      if (tags && tags.length > 0) {
        filterTags = tags;
        this.logger.log(`Filtering by explicit tags: ${tags.join(',')}`);
      } else if (userPreferences.length > 0) {
        filterTags = userPreferences;
        this.logger.log(
          `Filtering by user preference tags: ${userPreferences.join(',')}`,
        );
      }

      this.logger.log('Executing query for most liked posts...');

      // Build the WHERE clause based on tags
      let whereClause = Prisma.sql`WHERE p.published = true AND p."publishedAt" IS NOT NULL`;
      if (filterTags && filterTags.length > 0) {
        whereClause = Prisma.sql`WHERE p.published = true 
          AND p."publishedAt" IS NOT NULL 
          AND p.tags && ${filterTags}::text[]`;
      }

      // Execute raw SQL query with most liked ordering for featured content
      const posts: any[] = await this.prisma.$queryRaw`
        SELECT 
          p.id,
          p.title,
          p.content,
          p.slug,
          p.tags,
          p."featuredImage",
          p."publishedAt",
          p."createdAt",
          json_build_object(
            'id', u.id,
            'fullName', u."fullName",
            'avatar', u.avatar
          ) as author,
          COALESCE(COUNT(DISTINCT l.id), 0)::int as "likesCount",
          COALESCE(COUNT(DISTINCT c.id), 0)::int as "commentsCount",
          EXISTS(
            SELECT 1 FROM likes 
            WHERE likes."postId" = p.id 
            AND likes."userId" = ${userId || null}
          ) as "isLiked"
        FROM posts p
        INNER JOIN users u ON u.id = p."authorId"
        LEFT JOIN likes l ON l."postId" = p.id
        LEFT JOIN comments c ON c."postId" = p.id
        ${whereClause}
        GROUP BY p.id, u.id, u."fullName", u.avatar
        ORDER BY "likesCount" DESC, p."publishedAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      this.logger.log(`Fetched ${posts.length} posts`);

      // Get total count for pagination
      const countResult: any[] = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int as total
        FROM posts p
        ${whereClause}
      `;
      const totalCount = countResult[0]?.total || 0;

      this.logger.log(`Total count: ${totalCount}`);

      // Transform posts to DTO format with HTML content preserved
      const transformedPosts: PostSummaryDto[] = posts.map((post) => ({
        id: post.id,
        title: post.title,
        excerpt: this.createExcerpt(post.content), // Plain text excerpt
        content: post.content, // Full HTML content
        slug: post.slug,
        tags: post.tags,
        featuredImage: post.featuredImage || undefined,
        publishedAt: new Date(post.publishedAt),
        author: {
          id: post.author.id,
          fullName: post.author.fullName,
          avatar: post.author.avatar || undefined,
        },
        stats: {
          likesCount: post.likesCount,
          commentsCount: post.commentsCount,
        },
        isLiked: Boolean(post.isLiked),
      }));

      // Fetch available tags from user-created posts
      this.logger.log('Fetching available tags...');
      const availableTags = await this.getAvailableTags();

      const totalPages = Math.ceil(totalCount / limit);

      this.logger.log('Successfully completed request');

      return {
        success: true,
        message: 'Featured content retrieved successfully',
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        availableTags,
      };
    } catch (error) {
      this.logger.error('Error in getRecommendedContent:', error);
      throw new InternalServerErrorException(
        'Failed to fetch recommended content',
      );
    }
  }

  /**
   * Creates a plain text excerpt from HTML content
   * Strips HTML tags for preview purposes
   */
  private createExcerpt(content: string): string {
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150
      ? plainText.substring(0, 150) + '...'
      : plainText;
  }

  /**
   * Gets available tags from all published posts
   * Only tags that have been used by users in their posts
   */
  private async getAvailableTags(): Promise<string[]> {
    try {
      const posts = await this.prisma.post.findMany({
        where: {
          published: true,
          NOT: {
            tags: { isEmpty: true },
          },
        },
        select: {
          tags: true,
        },
        take: 1000,
      });

      const allTags = posts.flatMap((post) => post.tags);
      const uniqueTags = Array.from(new Set(allTags));

      const tagCounts = uniqueTags.map((tag) => ({
        tag,
        count: allTags.filter((t) => t === tag).length,
      }));

      return tagCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map((item) => item.tag);
    } catch (error) {
      this.logger.error('Error fetching available tags:', error);
      return [];
    }
  }
}
