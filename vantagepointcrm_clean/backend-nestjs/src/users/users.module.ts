import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AuditLog])],
  providers: [UsersService, AuditLogService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
