import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostModule } from './post/post.module';
import { PostsInteractionsModule } from './posts-interactions/posts-interactions.module';
import { UserModule } from './user/user.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { ExploreModule } from './explore/explore.module';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UploadService } from './upload/upload.service';
import { UploadModule } from './upload/upload.module';
@Module({
  imports: [
    ConfigModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,
        limit: 10,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 100,
      },
    ]),
    EmailModule,
    PrismaModule,
    AuthModule,
    PostModule,
    PostsInteractionsModule,
    UserModule,
    SubscriptionModule,
    ExploreModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, UploadService],
})
export class AppModule {}
