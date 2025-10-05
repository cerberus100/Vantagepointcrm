import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Lead, AuditLog])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
