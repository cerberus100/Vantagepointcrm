import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { User } from '../../users/entities/user.entity';

export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  PROPOSAL_SENT = 'proposal_sent',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
  ON_HOLD = 'on_hold',
  INACTIVE = 'inactive',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum LeadType {
  MEDICARE = 'medicare',
  RURAL = 'rural',
  ALLOGRAFT = 'allograft',
  GENERAL = 'general',
}

@Entity('leads', { schema: 'vantagepoint' })
@Index(['assigned_user_id'])
@Index(['status'])
@Index(['lead_type'])
@Index(['score'])
@Index(['priority'])
@Index(['created_at'])
@Index(['npi'])
@Index(['state'])
export class Lead {
  @ApiProperty({ description: 'Lead ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Practice name', example: 'Advanced Cardiology Center' })
  @Column({ type: 'varchar', length: 255 })
  practice_name: string;

  @ApiPropertyOptional({ description: 'NPI number', example: '1234567890' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  npi: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '(555) 123-4567' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address', example: 'info@cardiology.com' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @ApiPropertyOptional({ description: 'State code', example: 'CA' })
  @Column({ type: 'varchar', length: 2, nullable: true })
  state: string;

  @ApiPropertyOptional({ description: 'City', example: 'Los Angeles' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Medical Drive' })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiPropertyOptional({ 
    description: 'Lead score (0-100)', 
    example: 85,
    minimum: 0,
    maximum: 100 
  })
  @Column({ type: 'integer', nullable: true })
  score: number;

  @ApiProperty({ 
    description: 'Lead status', 
    enum: LeadStatus,
    example: LeadStatus.NEW 
  })
  @Column({ 
    type: 'enum', 
    enum: LeadStatus,
    default: LeadStatus.NEW 
  })
  status: LeadStatus;

  @ApiProperty({ 
    description: 'Lead priority', 
    enum: LeadPriority,
    example: LeadPriority.MEDIUM 
  })
  @Column({ 
    type: 'enum', 
    enum: LeadPriority,
    default: LeadPriority.MEDIUM 
  })
  priority: LeadPriority;

  @ApiProperty({ 
    description: 'Lead type', 
    enum: LeadType,
    example: LeadType.MEDICARE 
  })
  @Column({ 
    type: 'enum', 
    enum: LeadType,
    default: LeadType.GENERAL 
  })
  lead_type: LeadType;

  @ApiPropertyOptional({ description: 'Assigned user ID', example: 3 })
  @Column({ name: 'assigned_user_id', type: 'integer', nullable: true })
  assigned_user_id: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.assigned_leads)
  @JoinColumn({ name: 'assigned_user_id' })
  assigned_user: User;

  // Virtual properties
  @ApiPropertyOptional({ description: 'Assigned user name' })
  assigned_user_name?: string;

  @ApiPropertyOptional({ description: 'Days since creation' })
  days_since_creation?: number;

  @ApiPropertyOptional({ description: 'Days since last update' })
  days_since_update?: number;
}
