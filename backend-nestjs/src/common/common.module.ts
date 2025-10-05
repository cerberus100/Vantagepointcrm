import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './services/audit-log.service';
import { EmailService } from './services/email.service';
import { AuditLog } from './entities/audit-log.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogService, EmailService],
  exports: [AuditLogService, EmailService],
})
export class CommonModule {}
