import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Get,
  Ip,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with username and password'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                username: { type: 'string', example: 'john.doe' },
                email: { type: 'string', example: 'john.doe@example.com' },
                full_name: { type: 'string', example: 'John Doe' },
                role: { type: 'string', example: 'agent' },
                is_active: { type: 'boolean', example: true },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/auth/login' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            statusCode: { type: 'number', example: 401 },
            message: { type: 'string', example: 'Invalid credentials' },
            error: { type: 'string', example: 'Unauthorized' },
            timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
            path: { type: 'string', example: '/api/v1/auth/login' },
          },
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponse> {
    return this.authService.login(req.user, ipAddress, userAgent);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'User logout',
    description: 'Logout user and invalidate session'
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Logout successful' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/auth/logout' },
      },
    },
  })
  async logout(
    @Request() req: any,
    @Ip() ipAddress: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(req.user.id, req.user.username, ipAddress);
    return { message: 'Logout successful' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Change password',
    description: 'Change user password with current password verification'
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Password changed successfully' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/auth/change-password' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Current password is incorrect',
  })
  @ApiResponse({
    status: 400,
    description: 'Password validation failed',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { message: 'Password changed successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Get current user profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            username: { type: 'string', example: 'john.doe' },
            email: { type: 'string', example: 'john.doe@example.com' },
            full_name: { type: 'string', example: 'John Doe' },
            role: { type: 'string', example: 'agent' },
            is_active: { type: 'boolean', example: true },
            manager_id: { type: 'number', example: 2 },
            created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            updated_at: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/auth/profile' },
      },
    },
  })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
