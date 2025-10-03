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

export enum DocType {
  W9 = 'W9',
  BAA = 'BAA',
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  SIGNED = 'SIGNED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

@Entity('signatures', { schema: 'vantagepoint' })
@Index(['user_id'])
@Index(['doc_type'])
@Index(['status'])
export class Signature {
  @ApiProperty({ description: 'Signature ID', example: 'clx1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ name: 'user_id', type: 'integer' })
  user_id: number;

  @ApiProperty({ 
    description: 'Document type', 
    enum: DocType,
    example: DocType.W9 
  })
  @Column({ 
    type: 'enum', 
    enum: DocType 
  })
  doc_type: DocType;

  @ApiProperty({ 
    description: 'Envelope ID from e-sign provider', 
    example: 'env_1234567890' 
  })
  @Column({ type: 'varchar', length: 255 })
  envelope_id: string;

  @ApiProperty({ 
    description: 'Signature status', 
    enum: SignatureStatus,
    example: SignatureStatus.SIGNED 
  })
  @Column({ 
    type: 'enum', 
    enum: SignatureStatus,
    default: SignatureStatus.PENDING 
  })
  status: SignatureStatus;

  @ApiPropertyOptional({ description: 'When document was signed' })
  @Column({ type: 'timestamp', nullable: true })
  signed_at: Date;

  @ApiPropertyOptional({ description: 'URL to signed document' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  file_url: string;

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
  @ApiProperty({ description: 'Whether signature is completed' })
  get is_completed(): boolean {
    return this.status === SignatureStatus.SIGNED && this.signed_at !== null;
  }
}
