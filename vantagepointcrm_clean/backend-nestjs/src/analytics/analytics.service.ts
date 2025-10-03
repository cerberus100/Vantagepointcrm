import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { Lead, LeadStatus, LeadPriority, LeadType } from '../leads/entities/lead.entity';
import { AuditLog, AuditEventType } from '../common/entities/audit-log.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async getDashboardStats(): Promise<{
    users: {
      total: number;
      active: number;
      inactive: number;
      byRole: Record<string, number>;
    };
    leads: {
      total: number;
      byStatus: Record<LeadStatus, number>;
      byPriority: Record<LeadPriority, number>;
      byType: Record<LeadType, number>;
    };
    activity: {
      recentLogins: number;
      recentLeads: number;
      recentUpdates: number;
    };
  }> {
    const [userStats, leadStats, activityStats] = await Promise.all([
      this.getUserStats(),
      this.getLeadStats(),
      this.getActivityStats(),
    ]);

    return {
      users: userStats,
      leads: leadStats,
      activity: activityStats,
    };
  }

  private async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
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
    }, {} as Record<string, number>);

    return { total, active, inactive, byRole };
  }

  private async getLeadStats(): Promise<{
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

    return { total, byStatus, byPriority, byType };
  }

  private async getActivityStats(): Promise<{
    recentLogins: number;
    recentLeads: number;
    recentUpdates: number;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentLogins, recentLeads, recentUpdates] = await Promise.all([
      this.auditLogRepository.count({
        where: {
          event_type: AuditEventType.LOGIN_SUCCESS,
          timestamp: { $gte: last24Hours } as any,
        },
      }),
      this.auditLogRepository.count({
        where: {
          event_type: AuditEventType.LEAD_CREATED,
          timestamp: { $gte: last24Hours } as any,
        },
      }),
      this.auditLogRepository.count({
        where: {
          event_type: AuditEventType.LEAD_UPDATED,
          timestamp: { $gte: last24Hours } as any,
        },
      }),
    ]);

    return { recentLogins, recentLeads, recentUpdates };
  }

  async getLeadConversionMetrics(days: number = 30): Promise<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    averageConversionTime: number;
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const totalLeads = await this.leadRepository.count({
      where: {
        created_at: { $gte: startDate } as any,
      },
    });

    const convertedLeads = await this.leadRepository.count({
      where: {
        status: LeadStatus.CLOSED_WON,
        created_at: { $gte: startDate } as any,
      },
    });

    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Calculate average conversion time
    const conversionTimeQuery = await this.leadRepository
      .createQueryBuilder('lead')
      .select('AVG(EXTRACT(EPOCH FROM (lead.updated_at - lead.created_at)))', 'avgTime')
      .where('lead.status = :status', { status: LeadStatus.CLOSED_WON })
      .andWhere('lead.created_at >= :startDate', { startDate })
      .getRawOne();

    const averageConversionTime = conversionTimeQuery?.avgTime || 0;

    return {
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageConversionTime: Math.round(averageConversionTime),
    };
  }

  async getUserPerformanceMetrics(days: number = 30): Promise<{
    topPerformers: Array<{
      userId: number;
      username: string;
      fullName: string;
      leadsCreated: number;
      leadsConverted: number;
      conversionRate: number;
    }>;
    teamStats: {
      totalUsers: number;
      activeUsers: number;
      averageLeadsPerUser: number;
    };
  }> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get user performance data
    const userPerformance = await this.leadRepository
      .createQueryBuilder('lead')
      .leftJoin('lead.assigned_user', 'user')
      .select('user.id', 'userId')
      .addSelect('user.username', 'username')
      .addSelect('user.full_name', 'fullName')
      .addSelect('COUNT(*)', 'leadsCreated')
      .addSelect('COUNT(CASE WHEN lead.status = :closedWon THEN 1 END)', 'leadsConverted')
      .where('lead.created_at >= :startDate', { startDate })
      .andWhere('user.id IS NOT NULL')
      .groupBy('user.id, user.username, user.full_name')
      .setParameter('closedWon', LeadStatus.CLOSED_WON)
      .getRawMany();

    const topPerformers = userPerformance.map(user => ({
      userId: user.userId,
      username: user.username,
      fullName: user.fullName,
      leadsCreated: parseInt(user.leadsCreated),
      leadsConverted: parseInt(user.leadsConverted),
      conversionRate: user.leadsCreated > 0 
        ? Math.round((parseInt(user.leadsConverted) / parseInt(user.leadsCreated)) * 100 * 100) / 100
        : 0,
    })).sort((a, b) => b.conversionRate - a.conversionRate);

    // Get team stats
    const [totalUsers, activeUsers] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { is_active: true } }),
    ]);

    const totalLeads = await this.leadRepository.count({
      where: {
        created_at: { $gte: startDate } as any,
      },
    });

    const averageLeadsPerUser = activeUsers > 0 ? Math.round((totalLeads / activeUsers) * 100) / 100 : 0;

    return {
      topPerformers: topPerformers.slice(0, 10), // Top 10 performers
      teamStats: {
        totalUsers,
        activeUsers,
        averageLeadsPerUser,
      },
    };
  }

  async getActivityTimeline(days: number = 7): Promise<Array<{
    date: string;
    logins: number;
    leadsCreated: number;
    leadsUpdated: number;
  }>> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const timeline = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [logins, leadsCreated, leadsUpdated] = await Promise.all([
        this.auditLogRepository.count({
          where: {
            event_type: AuditEventType.LOGIN_SUCCESS,
            timestamp: { $gte: date, $lt: nextDate } as any,
          },
        }),
        this.auditLogRepository.count({
          where: {
            event_type: AuditEventType.LEAD_CREATED,
            timestamp: { $gte: date, $lt: nextDate } as any,
          },
        }),
        this.auditLogRepository.count({
          where: {
            event_type: AuditEventType.LEAD_UPDATED,
            timestamp: { $gte: date, $lt: nextDate } as any,
          },
        }),
      ]);

      timeline.push({
        date: date.toISOString().split('T')[0],
        logins,
        leadsCreated,
        leadsUpdated,
      });
    }

    return timeline;
  }
}
