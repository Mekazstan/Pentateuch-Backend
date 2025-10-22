import { Module } from '@nestjs/common';
import { FileUploadService } from './upload.service';

@Module({
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class UploadModule {}
