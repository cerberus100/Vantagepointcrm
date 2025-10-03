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

@Entity('training', { schema: 'vantagepoint' })
@Index(['user_id'], { unique: true })
@Index(['passed_at'])
export class Training {
  @ApiProperty({ description: 'Training ID', example: 'clx1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ name: 'user_id', type: 'integer', unique: true })
  user_id: number;

  @ApiPropertyOptional({ 
    description: 'Training quiz score (0-100)', 
    example: 85,
    minimum: 0,
    maximum: 100 
  })
  @Column({ type: 'integer', nullable: true })
  score: number;

  @ApiPropertyOptional({ description: 'When training was passed' })
  @Column({ type: 'timestamp', nullable: true })
  passed_at: Date;

  @ApiPropertyOptional({ 
    description: 'Attestation text', 
    example: 'I acknowledge that I have read and understand the compliance requirements.' 
  })
  @Column({ type: 'text', nullable: true })
  attestation: string;

  @ApiPropertyOptional({ description: 'When attestation was signed' })
  @Column({ type: 'timestamp', nullable: true })
  attested_at: Date;

  @ApiPropertyOptional({ 
    description: 'IP address when attestation was signed', 
    example: '192.168.1.100' 
  })
  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_addr: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Virtual properties
  @ApiProperty({ description: 'Whether training is completed' })
  get is_completed(): boolean {
    return this.passed_at !== null && this.attested_at !== null;
  }

  @ApiProperty({ description: 'Whether training score is passing (>=80)' })
  get is_passing_score(): boolean {
    return this.score !== null && this.score >= 80;
  }
}
