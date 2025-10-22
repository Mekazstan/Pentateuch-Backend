import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [EmailService, ConfigModule, ConfigService],
  exports: [EmailService],
})
export class EmailModule {}
