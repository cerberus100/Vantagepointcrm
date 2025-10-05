import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditEventType } from '../common/entities/audit-log.entity';

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async validateUser(username: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersService.findByUsername(username);
      
      if (!user || !user.is_active) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return null;
      }

      // Remove password hash from returned user
      const { password_hash, ...result } = user;
      return result as User;
    } catch (error) {
      this.logger.error(`Error validating user ${username}:`, error);
      return null;
    }
  }

  async login(user: User, ipAddress?: string, userAgent?: string): Promise<LoginResponse> {
    try {
      const payload: JwtPayload = {
        sub: user.id,
        username: user.username,
        role: user.role,
      };

      const access_token = this.jwtService.sign(payload);

      // Log successful login
      await this.auditLogService.logEvent(
        AuditEventType.LOGIN_SUCCESS,
        user.id,
        user.username,
        {
          ip_address: ipAddress,
          user_agent: userAgent,
          login_time: new Date().toISOString(),
        },
      );

      this.logger.log(`User ${user.username} logged in successfully`);

      return {
        access_token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          is_active: user.is_active,
        },
      };
    } catch (error) {
      this.logger.error(`Error during login for user ${user.username}:`, error);
      throw new BadRequestException('Login failed');
    }
  }

  async loginFailed(username: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      // Log failed login attempt
      await this.auditLogService.logEvent(
        AuditEventType.LOGIN_FAILED,
        null,
        username,
        {
          ip_address: ipAddress,
          user_agent: userAgent,
          attempt_time: new Date().toISOString(),
        },
      );

      this.logger.warn(`Failed login attempt for username: ${username} from IP: ${ipAddress}`);
    } catch (error) {
      this.logger.error(`Error logging failed login attempt:`, error);
    }
  }

  async logout(userId: number, username: string, ipAddress?: string): Promise<void> {
    try {
      // Log logout
      await this.auditLogService.logEvent(
        AuditEventType.LOGOUT,
        userId,
        username,
        {
          ip_address: ipAddress,
          logout_time: new Date().toISOString(),
        },
      );

      this.logger.log(`User ${username} logged out`);
    } catch (error) {
      this.logger.error(`Error during logout for user ${username}:`, error);
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      
      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      // Validate new password
      const minLength = this.configService.get<number>('app.security.passwordMinLength', 12);
      
      if (newPassword.length < minLength) {
        throw new BadRequestException(`Password must be at least ${minLength} characters long`);
      }

      // Hash new password
      const saltRounds = this.configService.get<number>('app.security.bcryptRounds', 12);
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await this.usersService.updatePassword(userId, newPasswordHash);

      // Log password change
      await this.auditLogService.logEvent(
        AuditEventType.PASSWORD_CHANGED,
        userId,
        user.username,
        {
          change_time: new Date().toISOString(),
        },
      );

      this.logger.log(`Password changed for user ${user.username}`);
    } catch (error) {
      this.logger.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
