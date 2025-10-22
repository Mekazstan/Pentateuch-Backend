/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { ExploreQueryDto, ExploreResponseDto } from './dto/explore-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('Content Discovery')
@ApiBearerAuth('access-token')
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @SkipThrottle()
  @ApiOperation({
    summary: 'Get recommended content',
    description:
      'Discover faith-based content with personalized recommendations for authenticated users',
  })
  @ApiResponse({
    status: 200,
    description: 'Content retrieved successfully',
    type: ExploreResponseDto,
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
    description: 'Items per page (default: 10, max: 50)',
    example: 10,
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter by tags (comma-separated)',
    example: 'faith,prayer,devotion',
  })
  @ApiBearerAuth('access-token')
  async getRecommendedContent(
    @Query() query: ExploreQueryDto,
    @CurrentUser() user?: any,
  ): Promise<ExploreResponseDto> {
    return this.exploreService.getRecommendedContent(query, user?.id);
  }
}
