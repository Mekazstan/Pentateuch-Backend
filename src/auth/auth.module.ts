import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { OAuth2Client } from 'google-auth-library';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { HttpModule } from '@nestjs/axios';
import { GoogleJwtService } from './services/google-jwt.service';
import { EmailModule } from '../email/email.module';
import { OptionalJwtAuthGuard } from './guards/optional-auth.guard';

@Global()
@Module({
  imports: [
    PassportModule,
    ConfigModule,
    EmailModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '1h') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    OptionalJwtAuthGuard,
    AuthService,
    GoogleJwtService,
    JwtStrategy,
    JwtAuthGuard,
    {
      provide: 'GOOGLE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new OAuth2Client(configService.get('GOOGLE_CLIENT_ID'));
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    GoogleJwtService,
    OptionalJwtAuthGuard,
  ],
})
export class AuthModule {}
