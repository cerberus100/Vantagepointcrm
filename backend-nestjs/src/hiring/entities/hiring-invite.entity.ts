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

export enum InviteStatus {
  SENT = 'SENT',
  OPENED = 'OPENED',
  DOCS = 'DOCS',
  PAYMENT = 'PAYMENT',
  TRAINED = 'TRAINED',
  ACTIVATED = 'ACTIVATED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

@Entity('hiring_invites', { schema: 'vantagepoint' })
@Index(['email'])
@Index(['token_hash'])
@Index(['status'])
@Index(['expires_at'])
export class HiringInvite {
  @ApiProperty({ description: 'Invite ID', example: 'clx1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'First name', example: 'John' })
  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @ApiProperty({ description: 'Email address', example: 'john.doe@example.com' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({ 
    description: 'Role for hire', 
    example: 'AGENT',
    default: 'AGENT'
  })
  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'AGENT' 
  })
  role_for_hire: string;

  @ApiProperty({ description: 'Token hash (for security)' })
  @Column({ type: 'varchar', length: 255 })
  token_hash: string;

  @ApiProperty({ description: 'Expiration timestamp' })
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @ApiPropertyOptional({ description: 'When invite was consumed' })
  @Column({ type: 'timestamp', nullable: true })
  consumed_at: Date;

  @ApiPropertyOptional({ description: 'When invite was first opened' })
  @Column({ type: 'timestamp', nullable: true })
  opened_at: Date;

  @ApiProperty({ description: 'Manager who sent the invite' })
  @Column({ name: 'manager_id', type: 'integer' })
  manager_id: number;

  @ApiProperty({ description: 'Invite status', enum: InviteStatus })
  @Column({ 
    type: 'enum', 
    enum: InviteStatus,
    default: InviteStatus.SENT 
  })
  status: InviteStatus;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  // Virtual properties
  @ApiProperty({ description: 'Full name' })
  get full_name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  @ApiProperty({ description: 'Whether invite is expired' })
  get is_expired(): boolean {
    return new Date() > this.expires_at;
  }

  @ApiProperty({ description: 'Whether invite is consumed' })
  get is_consumed(): boolean {
    return this.consumed_at !== null;
  }
}
