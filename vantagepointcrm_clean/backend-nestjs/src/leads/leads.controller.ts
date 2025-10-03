import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { Lead, LeadStatus, LeadPriority, LeadType } from './entities/lead.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ 
    summary: 'Create a new lead',
    description: 'Create a new lead record'
  })
  @ApiResponse({
    status: 201,
    description: 'Lead created successfully',
    type: Lead,
  })
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @Request() req: any,
  ): Promise<Lead> {
    return this.leadsService.create(createLeadDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ 
    summary: 'Get all leads',
    description: 'Retrieve a paginated list of leads'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, enum: LeadPriority, description: 'Filter by priority' })
  @ApiQuery({ name: 'leadType', required: false, enum: LeadType, description: 'Filter by lead type' })
  @ApiQuery({ name: 'assignedUserId', required: false, type: Number, description: 'Filter by assigned user' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by state' })
  @ApiResponse({
    status: 200,
    description: 'Leads retrieved successfully',
  })
  async findAll(
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
    @Query('status') status?: LeadStatus,
    @Query('priority') priority?: LeadPriority,
    @Query('leadType') leadType?: LeadType,
    @Query('assignedUserId', new ParseIntPipe({ optional: true })) assignedUserId?: number,
    @Query('state') state?: string,
  ) {
    return this.leadsService.findAll(page, limit, status, priority, leadType, assignedUserId, state);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get lead statistics',
    description: 'Retrieve lead statistics and counts'
  })
  @ApiResponse({
    status: 200,
    description: 'Lead statistics retrieved successfully',
  })
  async getStats() {
    return this.leadsService.getLeadStats();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ 
    summary: 'Get lead by ID',
    description: 'Retrieve a specific lead by ID'
  })
  @ApiResponse({
    status: 200,
    description: 'Lead retrieved successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Lead> {
    const lead = await this.leadsService.findOne(id);
    if (!lead) {
      throw new Error('Lead not found');
    }
    return lead;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT)
  @ApiOperation({ 
    summary: 'Update lead',
    description: 'Update lead information'
  })
  @ApiResponse({
    status: 200,
    description: 'Lead updated successfully',
    type: Lead,
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any,
  ): Promise<Lead> {
    return this.leadsService.update(id, updateLeadDto, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Delete lead',
    description: 'Delete a lead record'
  })
  @ApiResponse({
    status: 200,
    description: 'Lead deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Lead not found',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ): Promise<{ message: string }> {
    await this.leadsService.remove(id, req.user.id);
    return { message: 'Lead deleted successfully' };
  }
}
