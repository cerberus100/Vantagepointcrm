import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { Lead } from './entities/lead.entity';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, AuditLog])],
  providers: [LeadsService, AuditLogService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
