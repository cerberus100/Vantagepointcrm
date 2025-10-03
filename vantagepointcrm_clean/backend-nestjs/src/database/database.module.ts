import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Lead, AuditLog]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
