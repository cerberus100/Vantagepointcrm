import {
  Controller,
  Get,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get dashboard statistics',
    description: 'Retrieve comprehensive dashboard statistics including users, leads, and activity metrics'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            users: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                active: { type: 'number', example: 23 },
                inactive: { type: 'number', example: 2 },
                byRole: {
                  type: 'object',
                  properties: {
                    admin: { type: 'number', example: 2 },
                    manager: { type: 'number', example: 5 },
                    agent: { type: 'number', example: 18 },
                  },
                },
              },
            },
            leads: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 150 },
                byStatus: {
                  type: 'object',
                  properties: {
                    new: { type: 'number', example: 45 },
                    contacted: { type: 'number', example: 30 },
                    qualified: { type: 'number', example: 25 },
                    closed_won: { type: 'number', example: 20 },
                    closed_lost: { type: 'number', example: 15 },
                  },
                },
                byPriority: {
                  type: 'object',
                  properties: {
                    low: { type: 'number', example: 50 },
                    medium: { type: 'number', example: 60 },
                    high: { type: 'number', example: 30 },
                    urgent: { type: 'number', example: 10 },
                  },
                },
                byType: {
                  type: 'object',
                  properties: {
                    medicare: { type: 'number', example: 60 },
                    rural: { type: 'number', example: 40 },
                    allograft: { type: 'number', example: 30 },
                    general: { type: 'number', example: 20 },
                  },
                },
              },
            },
            activity: {
              type: 'object',
              properties: {
                recentLogins: { type: 'number', example: 15 },
                recentLeads: { type: 'number', example: 8 },
                recentUpdates: { type: 'number', example: 12 },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/analytics/dashboard' },
      },
    },
  })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('conversion-metrics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get lead conversion metrics',
    description: 'Retrieve lead conversion statistics and performance metrics'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({
    status: 200,
    description: 'Conversion metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalLeads: { type: 'number', example: 100 },
            convertedLeads: { type: 'number', example: 25 },
            conversionRate: { type: 'number', example: 25.0 },
            averageConversionTime: { type: 'number', example: 86400 },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/analytics/conversion-metrics' },
      },
    },
  })
  async getConversionMetrics(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ) {
    return this.analyticsService.getLeadConversionMetrics(days);
  }

  @Get('user-performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user performance metrics',
    description: 'Retrieve user performance statistics and top performers'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  @ApiResponse({
    status: 200,
    description: 'User performance metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            topPerformers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'number', example: 1 },
                  username: { type: 'string', example: 'john.doe' },
                  fullName: { type: 'string', example: 'John Doe' },
                  leadsCreated: { type: 'number', example: 15 },
                  leadsConverted: { type: 'number', example: 5 },
                  conversionRate: { type: 'number', example: 33.33 },
                },
              },
            },
            teamStats: {
              type: 'object',
              properties: {
                totalUsers: { type: 'number', example: 25 },
                activeUsers: { type: 'number', example: 23 },
                averageLeadsPerUser: { type: 'number', example: 6.5 },
              },
            },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/analytics/user-performance' },
      },
    },
  })
  async getUserPerformance(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 30,
  ) {
    return this.analyticsService.getUserPerformanceMetrics(days);
  }

  @Get('activity-timeline')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get activity timeline',
    description: 'Retrieve daily activity timeline for the specified period'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 7)' })
  @ApiResponse({
    status: 200,
    description: 'Activity timeline retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: '2024-01-15' },
              logins: { type: 'number', example: 5 },
              leadsCreated: { type: 'number', example: 3 },
              leadsUpdated: { type: 'number', example: 7 },
            },
          },
        },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        path: { type: 'string', example: '/api/v1/analytics/activity-timeline' },
      },
    },
  })
  async getActivityTimeline(
    @Query('days', new ParseIntPipe({ optional: true })) days: number = 7,
  ) {
    return this.analyticsService.getActivityTimeline(days);
  }
}
