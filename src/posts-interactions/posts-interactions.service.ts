import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommentDto,
  CommentResponseDto,
  CommentsListResponseDto,
  LikeResponseDto,
} from './dto/interactions.dto';

@Injectable()
export class PostsInteractionsService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleLike(postId: string, userId: string): Promise<LikeResponseDto> {
    // Check if post exists and is published
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        published: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked the post
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    let isLiked: boolean;

    if (existingLike) {
      // Unlike the post
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      isLiked = false;
    } else {
      // Like the post
      await this.prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      isLiked = true;
    }

    // Get updated likes count
    const likesCount = await this.prisma.like.count({
      where: {
        postId,
      },
    });

    return {
      success: true,
      message: isLiked
        ? 'Post liked successfully'
        : 'Post unliked successfully',
      data: {
        isLiked,
        likesCount,
      },
    };
  }

  async getComments(
    postId: string,
    page: number,
    limit: number,
  ): Promise<CommentsListResponseDto> {
    // Check if post exists and is published
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        published: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      message: 'Comments retrieved successfully',
      data: {
        comments: comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          author: comment.author,
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    };
  }

  async createComment(
    postId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<CommentResponseDto> {
    // Check if post exists, is published, and allows comments
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        published: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    if (!post.allowComments) {
      throw new BadRequestException('Comments are disabled for this post');
    }

    // Create the comment
    const comment = await this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        postId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Comment created successfully',
      data: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: comment.author,
      },
    };
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    // Find the comment and check ownership
    const comment = await this.prisma.comment.findUnique({
      where: {
        id: commentId,
      },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete the comment
    await this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully',
    };
  }
}
