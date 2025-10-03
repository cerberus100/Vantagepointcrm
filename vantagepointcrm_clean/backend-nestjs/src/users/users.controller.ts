import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Create a new user account. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: User,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - username or email already exists',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any,
  ): Promise<User> {
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieve a paginated list of users. Requires admin or manager role.'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole, description: 'Filter by role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'managerId', required: false, type: Number, description: 'Filter by manager ID' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            total: { type: 'number', example: 25 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/users' },
      },
    },
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
    @Query('managerId', new ParseIntPipe({ optional: true })) managerId?: number,
  ) {
    return this.usersService.findAll(page, limit, role, isActive, managerId);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Retrieve user statistics and counts. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 25 },
            active: { type: 'number', example: 23 },
            inactive: { type: 'number', example: 2 },
            byRole: {
              type: 'object',
              properties: {
                admin: { type: 'number', example: 2 },
                manager: { type: 'number', example: 5 },
                agent: { type: 'number', example: 18 },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/users/stats' },
      },
    },
  })
  async getStats() {
    return this.usersService.getUserStats();
  }

  @Get('managers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get all managers',
    description: 'Retrieve a list of all active managers. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'Managers retrieved successfully',
    type: [User],
  })
  async getManagers(): Promise<User[]> {
    return this.usersService.getManagers();
  }

  @Get('team/:managerId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get team members',
    description: 'Retrieve team members for a specific manager. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'Team members retrieved successfully',
    type: [User],
  })
  async getTeamMembers(
    @Param('managerId', ParseIntPipe) managerId: number,
  ): Promise<User[]> {
    return this.usersService.getTeamMembers(managerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieve a specific user by ID. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Update user',
    description: 'Update user information. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - username or email already exists',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto, req.user.id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deactivate user',
    description: 'Deactivate a user account. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<User> {
    return this.usersService.deactivate(id, req.user.id);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Activate user',
    description: 'Activate a user account. Requires admin or manager role.'
  })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<User> {
    return this.usersService.activate(id, req.user.id);
  }
}
