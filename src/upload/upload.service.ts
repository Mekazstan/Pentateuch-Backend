/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { Multer } from 'multer';

export interface FileUploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private readonly cloudinaryConfig: {
    cloud_name: string;
    api_key: string;
    api_secret: string;
  };

  constructor() {
    // Validate and get environment variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary configuration is missing. Please check environment variables.',
      );
    }

    this.cloudinaryConfig = {
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    };

    // Configure Cloudinary
    cloudinary.config(this.cloudinaryConfig);
  }

  /**
   * Upload a file to Cloudinary
   * @param file - Multer file object
   * @param folder - Cloudinary folder path
   * @param options - Additional upload options
   */
  async uploadFile(
    file: Multer.File,
    folder: string,
    options: {
      transformation?: any[];
      allowedFormats?: string[];
      maxFileSize?: number; // in bytes
    } = {},
  ): Promise<string> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Convert buffer to stream
      const stream = Readable.from(file.buffer);

      // Upload to Cloudinary
      const result = await new Promise<FileUploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            transformation: options.transformation,
            allowed_formats: options.allowedFormats,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload error:', error);
              reject(new BadRequestException('File upload failed'));
            } else if (!result) {
              // Handle case where result is undefined
              reject(
                new BadRequestException(
                  'File upload failed: No result from Cloudinary',
                ),
              );
            } else {
              resolve({
                url: result.secure_url || '',
                publicId: result.public_id || '',
                format: result.format || '',
                bytes: result.bytes || 0,
                width: result.width,
                height: result.height,
              });
            }
          },
        );

        stream.pipe(uploadStream);
      });

      this.logger.log(`File uploaded successfully: ${result.url}`);
      return result.url;
    } catch (error) {
      this.logger.error('File upload error:', error);
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Multer.File[],
    folder: string,
    options = {},
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, folder, options),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Multiple file upload error:', error);
      throw new BadRequestException('Failed to upload files');
    }
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`);
      return result.result === 'ok';
    } catch (error) {
      this.logger.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * Get optimized URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string | number;
      format?: string;
    } = {},
  ): string {
    return cloudinary.url(publicId, {
      ...transformations,
      secure: true,
    });
  }

  /**
   * Upload document with document-specific optimizations
   */
  async uploadDocument(
    file: Multer.File,
    documentType: string,
    userId: string,
  ): Promise<string> {
    const folder = `documents/${userId}/${documentType}`;

    const options = {
      allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      transformation: [
        {
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
    };

    return this.uploadFile(file, folder, options);
  }

  /**
   * Upload profile photo with specific transformations
   */
  async uploadProfilePhoto(file: Multer.File, userId: string): Promise<string> {
    const folder = `profile_photos/${userId}`;

    const options = {
      allowedFormats: ['jpg', 'jpeg', 'png'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
      transformation: [
        {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
    };

    return this.uploadFile(file, folder, options);
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: Multer.File,
    options: {
      allowedFormats?: string[];
      maxFileSize?: number;
    },
  ): void {
    // Check file size
    if (options.maxFileSize && file.size > options.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds limit of ${options.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check file format
    if (options.allowedFormats) {
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileExtension || !options.allowedFormats.includes(fileExtension)) {
        throw new BadRequestException(
          `File format not allowed. Allowed formats: ${options.allowedFormats.join(', ')}`,
        );
      }
    }

    // Basic file validation
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file not allowed');
    }
  }

  /**
   * Generate a signed URL for secure uploads (if needed for frontend direct uploads)
   */
  generateSignedUploadUrl(
    folder: string,
    publicId?: string,
  ): {
    url: string;
    signature: string;
    timestamp: number;
  } {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      folder,
      ...(publicId && { public_id: publicId }),
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      this.cloudinaryConfig.api_secret,
    );

    return {
      url: `https://api.cloudinary.com/v1_1/${this.cloudinaryConfig.cloud_name}/image/upload`,
      signature,
      timestamp,
    };
  }

  /**
   * Upload base64 image to Cloudinary
   */
  async uploadBase64(base64String: string, folder: string): Promise<string> {
    try {
      // Validate base64 format
      if (!base64String.startsWith('data:image/')) {
        throw new BadRequestException(
          'Invalid image format. Must be base64 encoded image.',
        );
      }

      const uploadOptions = {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          {
            width: 1200,
            height: 630,
            crop: 'limit',
            quality: 'auto:good',
            fetch_format: 'auto',
          },
        ],
      };

      const result = await cloudinary.uploader.upload(
        base64String,
        uploadOptions,
      );

      this.logger.log(`Base64 image uploaded: ${result.public_id}`);
      return result.secure_url;
    } catch (error) {
      this.logger.error('Base64 upload error:', error);
      throw new BadRequestException(error.message || 'Failed to upload image');
    }
  }
}
