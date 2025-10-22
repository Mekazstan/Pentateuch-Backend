import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

// Request DTOs
export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Email address to subscribe',
    example: 'subscriber@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

// Response DTOs
export class SubscriptionDataDto {
  @ApiProperty({
    description: 'Subscription ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  id: string;

  @ApiProperty({
    description: 'Subscribed email address',
    example: 'subscriber@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether the subscription is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date when subscription was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  subscribedAt: Date;
}

export class SubscriptionResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example:
      'Successfully subscribed to our newsletter! You will receive daily devotionals and updates.',
  })
  message: string;

  @ApiProperty({
    description: 'Subscription data',
    type: SubscriptionDataDto,
  })
  data: SubscriptionDataDto;
}
