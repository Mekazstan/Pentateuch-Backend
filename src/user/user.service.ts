import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateProfileDto,
  UserProfileResponseDto,
  UserPostsResponseDto,
  ProfileUpdateResponseDto,
} from './dto/users.dto';
import { Multer } from 'multer';
import { FileUploadService } from 'src/upload/upload.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async getUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        avatar: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: {
              where: {
                published: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        joinedAt: user.createdAt,
        postsCount: user._count.posts,
      },
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileUpdateResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // If email is being updated, check if it's already taken by another user
      if (
        updateProfileDto.email &&
        updateProfileDto.email !== existingUser.email
      ) {
        const emailExists = await this.prisma.user.findFirst({
          where: {
            email: updateProfileDto.email,
            id: {
              not: userId,
            },
          },
        });

        if (emailExists) {
          throw new BadRequestException('Email is already in use');
        }
      }

      // Update user profile
      const updatedUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...(updateProfileDto.fullName && {
            fullName: updateProfileDto.fullName,
          }),
          ...(updateProfileDto.email && { email: updateProfileDto.email }),
          ...(updateProfileDto.bio !== undefined && {
            bio: updateProfileDto.bio,
          }),
          ...(updateProfileDto.avatar !== undefined && {
            avatar: updateProfileDto.avatar,
          }),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          bio: true,
          updatedAt: true,
        },
      });

      // Update user preferences if provided
      if (updateProfileDto.tags && updateProfileDto.tags.length > 0) {
        await this.prisma.userPreference.upsert({
          where: {
            userId,
          },
          update: {
            tags: updateProfileDto.tags,
          },
          create: {
            userId,
            tags: updateProfileDto.tags,
          },
        });
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          updatedAt: updatedUser.updatedAt,
        },
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email is already in use');
      }
      throw error;
    }
  }

  async getUserPosts(
    userId: string,
    page: number,
    limit: number,
  ): Promise<UserPostsResponseDto> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId: userId,
          published: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          tags: true,
          publishedAt: true,
          createdAt: true,
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          authorId: userId,
          published: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      message: 'User posts retrieved successfully',
      data: {
        author: user,
        posts: posts.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt:
            post.content.substring(0, 200) +
            (post.content.length > 200 ? '...' : ''),
          tags: post.tags,
          publishedAt: post.publishedAt,
          createdAt: post.createdAt,
          likesCount: post._count.likes,
          commentsCount: post._count.comments,
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

  async updateAvatar(
    userId: string,
    file: Multer.File,
  ): Promise<ProfileUpdateResponseDto> {
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, avatar: true },
      });

      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      // Validate file
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      // Upload new avatar
      const avatarUrl = await this.fileUploadService.uploadProfilePhoto(
        file,
        userId,
      );

      // Delete old avatar from Cloudinary if exists
      if (existingUser.avatar) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = this.extractPublicIdFromUrl(existingUser.avatar);
          if (publicId) {
            await this.fileUploadService.deleteFile(publicId);
          }
        } catch (error) {
          // Log but don't fail if old avatar deletion fails
          console.warn('Failed to delete old avatar:', error);
        }
      }

      // Update user in database
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          bio: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        message: 'Avatar updated successfully',
        data: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          updatedAt: updatedUser.updatedAt,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to update avatar');
    }
  }

  private extractPublicIdFromUrl(url: string): string | null {
    try {
      // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
