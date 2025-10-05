import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditEventType } from '../common/entities/audit-log.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createUserDto: CreateUserDto, createdByUserId: number): Promise<User> {
    try {
      // Check if username already exists
      const existingUser = await this.userRepository.findOne({
        where: { username: createUserDto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      // Check if email already exists
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }

      // Validate manager assignment
      if (createUserDto.manager_id) {
        const manager = await this.findById(createUserDto.manager_id);
        if (!manager || manager.role !== UserRole.MANAGER) {
          throw new BadRequestException('Invalid manager ID or manager role required');
        }
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

      // Create user
      const user = this.userRepository.create({
        ...createUserDto,
        password_hash: passwordHash,
      });

      const savedUser = await this.userRepository.save(user);

      // Log user creation
      await this.auditLogService.logEvent(
        AuditEventType.USER_CREATED,
        createdByUserId,
        null,
        {
          created_user_id: savedUser.id,
          created_username: savedUser.username,
          role: savedUser.role,
        },
      );

      this.logger.log(`User created: ${savedUser.username} (ID: ${savedUser.id})`);

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = savedUser;
      return userWithoutPassword as User;
    } catch (error) {
      this.logger.error(`Error creating user: ${createUserDto.username}`, error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    role?: UserRole,
    isActive?: boolean,
    managerId?: number,
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.is_active = :isActive', { isActive });
    }

    if (managerId) {
      queryBuilder.andWhere('user.manager_id = :managerId', { managerId });
    }

    const [users, total] = await queryBuilder
      .orderBy('user.created_at', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getManyAndCount();

    // Remove password hashes from response
    const usersWithoutPasswords = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });

    return {
      users: usersWithoutPasswords,
      total,
      page,
      limit,
    };
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['manager', 'team_members'],
    });

    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    return null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    updatedByUserId: number,
  ): Promise<User> {
    try {
      const user = await this.findById(id);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check for conflicts if updating username or email
      if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.userRepository.findOne({
          where: { username: updateUserDto.username },
        });
        if (existingUser) {
          throw new ConflictException('Username already exists');
        }
      }

      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email: updateUserDto.email },
        });
        if (existingEmail) {
          throw new ConflictException('Email already exists');
        }
      }

      // Validate manager assignment
      if (updateUserDto.manager_id && updateUserDto.manager_id !== user.manager_id) {
        const manager = await this.findById(updateUserDto.manager_id);
        if (!manager || manager.role !== UserRole.MANAGER) {
          throw new BadRequestException('Invalid manager ID or manager role required');
        }
      }

      // Update user
      await this.userRepository.update(id, updateUserDto);
      const updatedUser = await this.findById(id);

      // Log user update
      await this.auditLogService.logEvent(
        AuditEventType.USER_UPDATED,
        updatedByUserId,
        null,
        {
          updated_user_id: id,
          updated_username: updatedUser.username,
          changes: updateUserDto,
        },
      );

      this.logger.log(`User updated: ${updatedUser.username} (ID: ${id})`);

      return updatedUser;
    } catch (error) {
      this.logger.error(`Error updating user ID ${id}`, error);
      throw error;
    }
  }

  async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(userId, {
      password_hash: newPasswordHash,
      password_changed_at: new Date(),
    });
  }

  async deactivate(id: number, deactivatedByUserId: number): Promise<User> {
    try {
      const user = await this.findById(id);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.is_active) {
        throw new BadRequestException('User is already inactive');
      }

      await this.userRepository.update(id, { is_active: false });
      const deactivatedUser = await this.findById(id);

      // Log user deactivation
      await this.auditLogService.logEvent(
        AuditEventType.USER_UPDATED,
        deactivatedByUserId,
        null,
        {
          updated_user_id: id,
          updated_username: deactivatedUser.username,
          changes: { is_active: false },
        },
      );

      this.logger.log(`User deactivated: ${deactivatedUser.username} (ID: ${id})`);

      return deactivatedUser;
    } catch (error) {
      this.logger.error(`Error deactivating user ID ${id}`, error);
      throw error;
    }
  }

  async activate(id: number, activatedByUserId: number): Promise<User> {
    try {
      const user = await this.findById(id);
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.is_active) {
        throw new BadRequestException('User is already active');
      }

      await this.userRepository.update(id, { is_active: true });
      const activatedUser = await this.findById(id);

      // Log user activation
      await this.auditLogService.logEvent(
        AuditEventType.USER_UPDATED,
        activatedByUserId,
        null,
        {
          updated_user_id: id,
          updated_username: activatedUser.username,
          changes: { is_active: true },
        },
      );

      this.logger.log(`User activated: ${activatedUser.username} (ID: ${id})`);

      return activatedUser;
    } catch (error) {
      this.logger.error(`Error activating user ID ${id}`, error);
      throw error;
    }
  }

  async getTeamMembers(managerId: number): Promise<User[]> {
    const teamMembers = await this.userRepository.find({
      where: { manager_id: managerId, is_active: true },
      order: { created_at: 'DESC' },
    });

    // Remove password hashes from response
    return teamMembers.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  async getManagers(): Promise<User[]> {
    const managers = await this.userRepository.find({
      where: { role: UserRole.MANAGER, is_active: true },
      order: { full_name: 'ASC' },
    });

    // Remove password hashes from response
    return managers.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, inactive] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
      this.userRepository.count({ where: { is_active: false } }),
    ]);

    const roleStats = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const byRole = roleStats.reduce((acc, stat) => {
      acc[stat.role] = parseInt(stat.count);
      return acc;
    }, {} as Record<UserRole, number>);

    return {
      total,
      active,
      inactive,
      byRole,
    };
  }
}
