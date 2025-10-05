import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLog, AuditEventType } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async logEvent(
    eventType: AuditEventType,
    userId: number | null,
    username: string | null,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string,
    entityType?: string,
    entityId?: number,
    success: boolean = true,
    errorMessage?: string,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        event_type: eventType,
        user_id: userId,
        username,
        ip_address: ipAddress,
        user_agent: userAgent,
        entity_type: entityType,
        entity_id: entityId,
        details,
        success,
        error_message: errorMessage,
      });

      await this.auditLogRepository.save(auditLog);
      
      this.logger.log(
        `Audit logged: ${eventType} by ${username || 'system'} (User ID: ${userId || 'N/A'})`,
      );
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${eventType}`, error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getAuditLogs(
    userId?: number,
    eventType?: AuditEventType,
    entityType?: string,
    entityId?: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    if (userId) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId });
    }

    if (eventType) {
      queryBuilder.andWhere('audit_log.event_type = :eventType', { eventType });
    }

    if (entityType) {
      queryBuilder.andWhere('audit_log.entity_type = :entityType', { entityType });
    }

    if (entityId) {
      queryBuilder.andWhere('audit_log.entity_id = :entityId', { entityId });
    }

    if (startDate) {
      queryBuilder.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    queryBuilder
      .orderBy('audit_log.timestamp', 'DESC')
      .limit(limit)
      .offset(offset);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return { logs, total };
  }

  async getFailedLoginAttempts(
    username?: string,
    ipAddress?: string,
    hours: number = 24,
  ): Promise<AuditLog[]> {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit_log');

    queryBuilder
      .where('audit_log.event_type = :eventType', { eventType: AuditEventType.LOGIN_FAILED })
      .andWhere('audit_log.timestamp >= :since', { 
        since: new Date(Date.now() - hours * 60 * 60 * 1000) 
      });

    if (username) {
      queryBuilder.andWhere('audit_log.username = :username', { username });
    }

    if (ipAddress) {
      queryBuilder.andWhere('audit_log.ip_address = :ipAddress', { ipAddress });
    }

    return queryBuilder
      .orderBy('audit_log.timestamp', 'DESC')
      .getMany();
  }

  async getUserActivity(
    userId: number,
    days: number = 30,
  ): Promise<AuditLog[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.auditLogRepository
      .createQueryBuilder('audit_log')
      .where('audit_log.user_id = :userId', { userId })
      .andWhere('audit_log.timestamp >= :since', { since })
      .orderBy('audit_log.timestamp', 'DESC')
      .getMany();
  }
}
