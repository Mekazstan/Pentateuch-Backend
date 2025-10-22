/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

interface GoogleTokenInfo {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: string;
}

@Injectable()
export class GoogleJwtService {
  private readonly logger = new Logger(GoogleJwtService.name);
  private readonly GOOGLE_TOKEN_INFO_URL =
    'https://oauth2.googleapis.com/tokeninfo';
  private allowedClientIds: string[] = [];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Initialize with your web client ID
    this.allowedClientIds = [
      configService.get('GOOGLE_WEB_CLIENT_ID'), // Web client ID
      // Mobile client IDs will be added later
    ].filter(Boolean);
  }

  async verifyGoogleToken(accessToken: string): Promise<GoogleTokenInfo> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<GoogleTokenInfo>(
          `${this.GOOGLE_TOKEN_INFO_URL}?access_token=${accessToken}`,
        ),
      );

      const tokenInfo = response.data;

      if (
        process.env.NODE_ENV === 'production' &&
        this.allowedClientIds.length > 0
      ) {
        if (!this.allowedClientIds.includes(tokenInfo.aud)) {
          this.logger.warn(`Token from unauthorized client: ${tokenInfo.aud}`);
          // throw new BadRequestException('Unauthorized client application');
        }
      }

      // Validate token
      if (!tokenInfo.email_verified) {
        throw new BadRequestException('Email not verified by Google');
      }

      if (!tokenInfo.email || !tokenInfo.sub) {
        throw new BadRequestException('Invalid Google token payload');
      }

      return tokenInfo;
    } catch (error) {
      this.logger.error('Google token verification failed', error.stack);
      throw new BadRequestException('Invalid Google access token');
    }
  }

  // Method to add mobile client IDs later
  addAllowedClientId(clientId: string) {
    if (!this.allowedClientIds.includes(clientId)) {
      this.allowedClientIds.push(clientId);
      this.logger.log(`Added allowed client ID: ${clientId}`);
    }
  }
}
