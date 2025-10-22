/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const payload = this.jwtService.verify(token);
        // Attach user to request object
        request.user = payload;
        return true;
      } catch (error) {
        // Token is invalid, but we don't throw an error
        // Just continue without user authentication
        return true;
      }
    }

    // No token provided, continue without authentication
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
