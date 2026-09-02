import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException, UseFilters } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException("User role not found");
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new UnauthorizedException('You do not have permission to access this resource');
    }

    return true;
  }
}
