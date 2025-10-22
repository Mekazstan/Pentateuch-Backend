import { Module } from '@nestjs/common';
import { PostsInteractionsController } from './posts-interactions.controller';
import { PostsInteractionsService } from './posts-interactions.service';

@Module({
  controllers: [PostsInteractionsController],
  providers: [PostsInteractionsService],
})
export class PostsInteractionsModule {}
