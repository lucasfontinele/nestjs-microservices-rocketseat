import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { AuthService } from '../auth/service/auth.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const sessionToken = request.headers['x-session-token'] as string;
    
    if (!sessionToken) {
      throw new UnauthorizedException('Session token is required');
    }

    try {
      const session = await this.authService.validateSessionToken(sessionToken);

      if (!session.valid || !session.user) {
        throw new UnauthorizedException('Invalid session token');
      }

      request.user = session.user;
    } catch {
      throw new UnauthorizedException('Invalid session token');
    }

    return true;
  }
}
