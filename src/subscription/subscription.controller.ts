import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscription.service';
import {
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto/subscriptions.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Email Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Subscribe to newsletter',
    description:
      'Subscribe an email address to the newsletter for daily devotionals',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully subscribed to newsletter',
    type: SubscriptionResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid email address or email already subscribed',
  })
  @ApiInternalServerErrorResponse({
    description: 'Failed to process subscription',
  })
  @Throttle({ short: { limit: 5, ttl: 3600000 } })
  async subscribe(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.subscribe(createSubscriptionDto);
  }
}
