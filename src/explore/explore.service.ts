/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ExploreQueryDto,
  ExploreResponseDto,
  PostSummaryDto,
} from './dto/explore-query.dto';

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRecommendedContent(
    query: ExploreQueryDto,
    userId?: string,
  ): Promise<ExploreResponseDto> {
    const { page = 1, limit = 10, tags } = query;
    const skip = (page - 1) * limit;

    let userPreferences: string[] = [];
    if (userId) {
      const preferences = await this.prisma.userPreference.findUnique({
        where: { userId },
        select: { tags: true },
      });
      userPreferences = preferences?.tags || [];
    }

    const whereClause: any = {
      published: true,
      publishedAt: { not: null },
    };

    // Apply tag filtering
    if (tags && tags.length > 0) {
      whereClause.tags = { hasSome: tags };
    } else if (userPreferences.length > 0) {
      whereClause.tags = { hasSome: userPreferences };
    }

    // Use Prisma's aggregation for sorting by engagement
    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          content: true,
          slug: true,
          tags: true,
          publishedAt: true,
          author: {
            select: { id: true, fullName: true, avatar: true },
          },
          _count: {
            select: { likes: true, comments: true },
          },
        },
        orderBy: [
          // Sort by engagement score in database
          { likes: { _count: 'desc' } },
          { publishedAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    // Remove in-memory sorting - already sorted by DB
    const transformedPosts: PostSummaryDto[] = posts.map((post) => ({
      id: post.id,
      title: post.title,
      excerpt: this.createExcerpt(post.content),
      slug: post.slug,
      tags: post.tags,
      publishedAt: post.publishedAt!,
      author: {
        id: post.author.id,
        fullName: post.author.fullName,
        avatar: post.author.avatar || undefined,
      },
      stats: {
        likesCount: post._count.likes,
        commentsCount: post._count.comments,
      },
    }));

    const availableTags = await this.getAvailableTags();
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      message: 'Content retrieved successfully',
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
  }

  private sortPostsByEngagement(
    posts: any[],
    hasUserPreferences: boolean,
  ): any[] {
    if (hasUserPreferences) {
      // For personalized content, prioritize recent posts with engagement
      return posts.sort((a, b) => {
        const aEngagement = a._count.likes + a._count.comments;
        const bEngagement = b._count.likes + b._count.comments;

        // If engagement is similar, sort by recency
        if (Math.abs(aEngagement - bEngagement) < 5) {
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
        }

        return bEngagement - aEngagement;
      });
    }

    // For general explore, prioritize highly engaged content
    return posts.sort((a, b) => {
      const aScore = a._count.likes * 2 + a._count.comments;
      const bScore = b._count.likes * 2 + b._count.comments;

      if (aScore === bScore) {
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }

      return bScore - aScore;
    });
  }

  private createExcerpt(content: string): string {
    // Remove HTML tags if any and create excerpt
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 150
      ? plainText.substring(0, 150) + '...'
      : plainText;
  }

  private async getAvailableTags(): Promise<string[]> {
    try {
      // Get unique tags from published posts
      const posts = await this.prisma.post.findMany({
        where: {
          published: true,
          tags: {
            isEmpty: false,
          },
        },
        select: {
          tags: true,
        },
        take: 1000, // Limit to prevent performance issues
      });

      // Flatten and get unique tags
      const allTags = posts.flatMap((post) => post.tags);
      const uniqueTags = Array.from(new Set(allTags));

      // Sort by frequency (most used first)
      const tagCounts = uniqueTags.map((tag) => ({
        tag,
        count: allTags.filter((t) => t === tag).length,
      }));

      return tagCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 20) // Return top 20 tags
        .map((item) => item.tag);
    } catch (error) {
      this.logger.error('Error fetching available tags:', error);
      return []; // Return empty array on error instead of crashing
    }
  }
}
