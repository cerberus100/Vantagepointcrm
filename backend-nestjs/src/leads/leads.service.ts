import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';

import { Lead, LeadStatus, LeadPriority, LeadType } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AuditLogService } from '../common/services/audit-log.service';
import { AuditEventType } from '../common/entities/audit-log.entity';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(createLeadDto: CreateLeadDto, createdByUserId: number): Promise<Lead> {
    try {
      const lead = this.leadRepository.create(createLeadDto);
      const savedLead = await this.leadRepository.save(lead);

      // Log lead creation
      await this.auditLogService.logEvent(
        AuditEventType.LEAD_CREATED,
        createdByUserId,
        null,
        {
          lead_id: savedLead.id,
          practice_name: savedLead.practice_name,
          lead_type: savedLead.lead_type,
        },
        null,
        null,
        'Lead',
        savedLead.id,
      );

      this.logger.log(`Lead created: ${savedLead.practice_name} (ID: ${savedLead.id})`);

      return savedLead;
    } catch (error) {
      this.logger.error(`Error creating lead: ${createLeadDto.practice_name}`, error);
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: LeadStatus,
    priority?: LeadPriority,
    leadType?: LeadType,
    assignedUserId?: number,
    state?: string,
  ): Promise<{ leads: Lead[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.leadRepository.createQueryBuilder('lead');

    if (status) {
      queryBuilder.andWhere('lead.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('lead.priority = :priority', { priority });
    }

    if (leadType) {
      queryBuilder.andWhere('lead.lead_type = :leadType', { leadType });
    }

    if (assignedUserId) {
      queryBuilder.andWhere('lead.assigned_user_id = :assignedUserId', { assignedUserId });
    }

    if (state) {
      queryBuilder.andWhere('lead.state = :state', { state });
    }

    const [leads, total] = await queryBuilder
      .leftJoinAndSelect('lead.assigned_user', 'assigned_user')
      .orderBy('lead.created_at', 'DESC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getManyAndCount();

    return {
      leads,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Lead | null> {
    return this.leadRepository.findOne({
      where: { id },
      relations: ['assigned_user'],
    });
  }

  async update(
    id: number,
    updateLeadDto: UpdateLeadDto,
    updatedByUserId: number,
  ): Promise<Lead> {
    try {
      const lead = await this.findOne(id);
      
      if (!lead) {
        throw new Error('Lead not found');
      }

      await this.leadRepository.update(id, updateLeadDto);
      const updatedLead = await this.findOne(id);

      // Log lead update
      await this.auditLogService.logEvent(
        AuditEventType.LEAD_UPDATED,
        updatedByUserId,
        null,
        {
          lead_id: id,
          practice_name: updatedLead.practice_name,
          changes: updateLeadDto,
        },
        null,
        null,
        'Lead',
        id,
      );

      this.logger.log(`Lead updated: ${updatedLead.practice_name} (ID: ${id})`);

      return updatedLead;
    } catch (error) {
      this.logger.error(`Error updating lead ID ${id}`, error);
      throw error;
    }
  }

  async remove(id: number, deletedByUserId: number): Promise<void> {
    try {
      const lead = await this.findOne(id);
      
      if (!lead) {
        throw new Error('Lead not found');
      }

      await this.leadRepository.delete(id);

      // Log lead deletion
      await this.auditLogService.logEvent(
        AuditEventType.LEAD_DELETED,
        deletedByUserId,
        null,
        {
          lead_id: id,
          practice_name: lead.practice_name,
        },
        null,
        null,
        'Lead',
        id,
      );

      this.logger.log(`Lead deleted: ${lead.practice_name} (ID: ${id})`);
    } catch (error) {
      this.logger.error(`Error deleting lead ID ${id}`, error);
      throw error;
    }
  }

  async getLeadStats(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    byPriority: Record<LeadPriority, number>;
    byType: Record<LeadType, number>;
  }> {
    const [total, statusStats, priorityStats, typeStats] = await Promise.all([
      this.leadRepository.count(),
      this.leadRepository
        .createQueryBuilder('lead')
        .select('lead.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.status')
        .getRawMany(),
      this.leadRepository
        .createQueryBuilder('lead')
        .select('lead.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.priority')
        .getRawMany(),
      this.leadRepository
        .createQueryBuilder('lead')
        .select('lead.lead_type', 'lead_type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('lead.lead_type')
        .getRawMany(),
    ]);

    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {} as Record<LeadStatus, number>);

    const byPriority = priorityStats.reduce((acc, stat) => {
      acc[stat.priority] = parseInt(stat.count);
      return acc;
    }, {} as Record<LeadPriority, number>);

    const byType = typeStats.reduce((acc, stat) => {
      acc[stat.lead_type] = parseInt(stat.count);
      return acc;
    }, {} as Record<LeadType, number>);

    return {
      total,
      byStatus,
      byPriority,
      byType,
    };
  }
}
