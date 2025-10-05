import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { User } from '../../users/entities/user.entity';

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_UPDATED = 'LEAD_UPDATED',
  LEAD_DELETED = 'LEAD_DELETED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_EXPORT = 'DATA_EXPORT',
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  // Hiring system events
  INVITE_CREATED = 'INVITE_CREATED',
  INVITE_RESENT = 'INVITE_RESENT',
  INVITE_REVOKED = 'INVITE_REVOKED',
  INVITE_OPENED = 'INVITE_OPENED',
  DOCUMENT_SIGNED = 'DOCUMENT_SIGNED',
  PAYMENT_UPLOADED = 'PAYMENT_UPLOADED',
  TRAINING_COMPLETED = 'TRAINING_COMPLETED',
  ONBOARDING_COMPLETED = 'ONBOARDING_COMPLETED',
}

@Entity('audit_logs', { schema: 'vantagepoint' })
@Index(['timestamp'])
@Index(['event_type'])
@Index(['user_id'])
@Index(['entity_type'])
@Index(['entity_id'])
export class AuditLog {
  @ApiProperty({ description: 'Audit log ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Event timestamp' })
  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @ApiProperty({ 
    description: 'Event type', 
    enum: AuditEventType,
    example: AuditEventType.LEAD_CREATED 
  })
  @Column({ 
    type: 'enum', 
    enum: AuditEventType 
  })
  event_type: AuditEventType;

  @ApiPropertyOptional({ description: 'User ID who performed the action', example: 1 })
  @Column({ name: 'user_id', type: 'integer', nullable: true })
  user_id: number;

  @ApiPropertyOptional({ description: 'Username who performed the action', example: 'john.doe' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  username: string;

  @ApiPropertyOptional({ description: 'IP address', example: '192.168.1.1' })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string;

  @ApiPropertyOptional({ description: 'User agent', example: 'Mozilla/5.0...' })
  @Column({ type: 'text', nullable: true })
  user_agent: string;

  @ApiPropertyOptional({ description: 'Entity type affected', example: 'Lead' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  entity_type: string;

  @ApiPropertyOptional({ description: 'Entity ID affected', example: 123 })
  @Column({ name: 'entity_id', type: 'integer', nullable: true })
  entity_id: number;

  @ApiPropertyOptional({ description: 'Event details (JSON)', example: { field: 'status', old_value: 'new', new_value: 'contacted' } })
  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @ApiPropertyOptional({ description: 'Success status', example: true })
  @Column({ type: 'boolean', default: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if failed', example: 'Permission denied' })
  @Column({ type: 'text', nullable: true })
  error_message: string;

  // Relationships
  @ManyToOne(() => User, (user) => user.audit_logs)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
