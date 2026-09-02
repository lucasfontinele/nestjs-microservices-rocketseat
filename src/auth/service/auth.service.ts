import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { serviceConfig } from '../../config/gateway.config.js';

interface UserSession {
  valid: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService
  ) {}

  validateJwtToken(token: string): Promise<any> {
    try {
      return this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async validateSessionToken(sessionToken: string): Promise<UserSession> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<UserSession>(`${serviceConfig.users.url}/sessions/validate/${sessionToken}`)
      )

      return data;
    } catch {
      throw new UnauthorizedException('Invalid session token');
    }
  }

  async login(loginDto: { email: string; password: string }) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{ sessionToken: string }>(`${serviceConfig.users.url}/login`, loginDto, {
          timeout: serviceConfig.users.timeout,
        })
      );
      
      return data;
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(register: any) {
    const { data } = await firstValueFrom(
      this.httpService.post<{ sessionToken: string }>(`${serviceConfig.users.url}/register`, register, {
        timeout: serviceConfig.users.timeout,
      })
    );

    return data;
  }
}
