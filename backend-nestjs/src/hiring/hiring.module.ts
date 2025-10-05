import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { HiringController, OnboardingController } from './hiring.controller';
import { HiringService } from './hiring.service';
import { HiringInvite } from './entities/hiring-invite.entity';
import { Signature } from './entities/signature.entity';
import { PaymentDocument } from './entities/payment-document.entity';
import { Training } from './entities/training.entity';
import { User } from '../users/entities/user.entity';
import { AuditLogService } from '../common/services/audit-log.service';
import { EmailService } from '../common/services/email.service';
import { AuditLog } from '../common/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HiringInvite,
      Signature,
      PaymentDocument,
      Training,
      User,
      AuditLog,
    ]),
    JwtModule,
  ],
  controllers: [HiringController, OnboardingController],
  providers: [HiringService, AuditLogService, EmailService],
  exports: [HiringService],
})
export class HiringModule {}
