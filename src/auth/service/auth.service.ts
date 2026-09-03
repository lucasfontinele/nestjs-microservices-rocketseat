import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';
import { serviceConfig } from '../../config/gateway.config.js';
import { LoginDTO } from '../dtos/login.dto.js';
import { RegisterDTO } from '../dtos/register.dto.js';

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

export interface AuthResponse {
  access_token: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
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

  async login(loginDto: LoginDTO): Promise<AuthResponse> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<AuthResponse>(`${serviceConfig.users.url}/login`, loginDto, {
          timeout: serviceConfig.users.timeout,
        })
      );
      
      return data;
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async register(register: RegisterDTO): Promise<AuthResponse> {
    const { data } = await firstValueFrom(
      this.httpService.post<AuthResponse>(`${serviceConfig.users.url}/register`, register, {
        timeout: serviceConfig.users.timeout,
      })
    );

    return data;
  }
}
