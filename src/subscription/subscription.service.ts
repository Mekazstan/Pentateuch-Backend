import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto/subscriptions.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    const { email } = createSubscriptionDto;

    try {
      // Check if email already exists
      const existingSubscription =
        await this.prisma.emailSubscription.findUnique({
          where: {
            email,
          },
        });

      if (existingSubscription) {
        if (existingSubscription.isActive) {
          throw new BadRequestException(
            'This email is already subscribed to our newsletter',
          );
        } else {
          // Reactivate existing subscription
          const reactivatedSubscription =
            await this.prisma.emailSubscription.update({
              where: {
                email,
              },
              data: {
                isActive: true,
              },
            });

          return {
            success: true,
            message: 'Successfully reactivated your newsletter subscription',
            data: {
              id: reactivatedSubscription.id,
              email: reactivatedSubscription.email,
              isActive: reactivatedSubscription.isActive,
              subscribedAt: reactivatedSubscription.createdAt,
            },
          };
        }
      }

      // Create new subscription
      const subscription = await this.prisma.emailSubscription.create({
        data: {
          email,
          isActive: true,
        },
      });

      return {
        success: true,
        message:
          'Successfully subscribed to our newsletter! You will receive daily devotionals and updates.',
        data: {
          id: subscription.id,
          email: subscription.email,
          isActive: subscription.isActive,
          subscribedAt: subscription.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Handle Prisma unique constraint error
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'This email is already subscribed to our newsletter',
        );
      }

      throw error;
    }
  }
}
