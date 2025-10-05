import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/entities/user.entity';

@ApiTags('Setup')
@Controller('setup')
export class SetupController {
  constructor(private dataSource: DataSource) {}

  @Post('create-admin')
  @ApiOperation({ 
    summary: 'Create initial admin user',
    description: 'Creates the first admin user for the system. Only works if no admin users exist.'
  })
  @ApiResponse({
    status: 201,
    description: 'Admin user created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Admin user already exists or invalid data',
  })
  async createAdminUser(@Body() body: { username?: string; password?: string; email?: string }) {
    try {
      const userRepository = this.dataSource.getRepository(User);

      // Check if any admin users already exist
      const existingAdmin = await userRepository.findOne({
        where: { role: UserRole.ADMIN }
      });

      if (existingAdmin) {
        throw new HttpException(
          'Admin user already exists. Use existing credentials to login.',
          HttpStatus.BAD_REQUEST
        );
      }

      // Use provided credentials or defaults
      const username = body.username || 'admin';
      const password = body.password || 'VantagePoint2024!';
      const email = body.email || 'admin@vantagepointcrm.com';

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create admin user
      const adminUser = userRepository.create({
        username,
        password_hash: passwordHash,
        email,
        full_name: 'System Administrator',
        role: UserRole.ADMIN,
        is_active: true,
        manager_id: null,
      });

      await userRepository.save(adminUser);

      return {
        success: true,
        message: 'Admin user created successfully!',
        credentials: {
          username,
          email,
          role: 'ADMIN'
        },
        note: 'Please change the password after first login'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create admin user: ' + error.message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
