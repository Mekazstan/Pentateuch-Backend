/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Param,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  Query,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './user.service';
import {
  UpdateProfileDto,
  UserProfileResponseDto,
  UserPostsResponseDto,
  ProfileUpdateResponseDto,
  CurrentUserProfileResponseDto,
} from './dto/users.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Multer } from 'multer';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile retrieved successfully',
    type: CurrentUserProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @CurrentUser() user: any,
  ): Promise<CurrentUserProfileResponseDto> {
    return this.usersService.getCurrentUserProfile(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieve public profile information for a specific user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve user profile',
  })
  @SkipThrottle()
  async getUserProfile(
    @Param('id') userId: string,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.getUserProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update own profile',
    description: "Update authenticated user's profile information",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: ProfileUpdateResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or email already exists',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to update profile',
  })
  @Throttle({ short: { limit: 10, ttl: 3600000 } })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() user: any,
  ): Promise<ProfileUpdateResponseDto> {
    const userId = user.id;
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  @Get(':id/posts')
  @ApiOperation({
    summary: "Get user's posts",
    description:
      'Retrieve paginated list of published posts by a specific user',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
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
    description: 'Posts per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User posts retrieved successfully',
    type: UserPostsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to retrieve user posts',
  })
  @SkipThrottle()
  async getUserPosts(
    @Param('id') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<UserPostsResponseDto> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

    return this.usersService.getUserPosts(userId, pageNum, limitNum);
  }

  @Patch('profile/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Throttle({ short: { limit: 5, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor('avatar'))
  async updateAvatar(
    @UploadedFile() file: Multer.File,
    @CurrentUser() user: any,
  ): Promise<ProfileUpdateResponseDto> {
    return this.usersService.updateAvatar(user.id, file);
  }
}
