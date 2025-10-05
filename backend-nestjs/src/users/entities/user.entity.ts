import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Lead } from '../../leads/entities/lead.entity';
import { AuditLog } from '../../common/entities/audit-log.entity';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  HIRING_TEAM = 'hiring_team',
}

@Entity('users', { schema: 'vantagepoint' })
@Index(['username'], { unique: true })
@Index(['email'], { unique: true })
@Index(['role'])
@Index(['manager_id'])
export class User {
  @ApiProperty({ description: 'User ID', example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Username', example: 'john.doe' })
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @ApiProperty({ description: 'Password hash (excluded from responses)' })
  @Column({ type: 'varchar', length: 255 })
  @Exclude()
  password_hash: string;

  @ApiProperty({ 
    description: 'User role', 
    enum: UserRole,
    example: UserRole.AGENT 
  })
  @Column({ 
    type: 'enum', 
    enum: UserRole,
    default: UserRole.AGENT 
  })
  role: UserRole;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @ApiProperty({ description: 'Full name', example: 'John Doe' })
  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @ApiProperty({ description: 'Whether user is active', example: true })
  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ApiPropertyOptional({ description: 'Manager ID for agents', example: 2 })
  @Column({ name: 'manager_id', type: 'integer', nullable: true })
  manager_id: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ApiProperty({ description: 'Password change timestamp' })
  @Column({ name: 'password_changed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  password_changed_at: Date;

  // Relationships
  @OneToMany(() => Lead, (lead) => lead.assigned_user)
  assigned_leads: Lead[];

  @OneToMany(() => User, (user) => user.manager)
  team_members: User[];

  @ManyToOne(() => User, (user) => user.team_members)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => AuditLog, (auditLog) => auditLog.user)
  audit_logs: AuditLog[];

  // Virtual properties
  @ApiProperty({ description: 'Number of assigned leads' })
  assigned_leads_count?: number;

  @ApiProperty({ description: 'Number of team members (for managers)' })
  team_members_count?: number;
}
