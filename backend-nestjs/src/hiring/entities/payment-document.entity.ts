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

export enum PaymentDocType {
  ACH_VOIDED_CHECK = 'ACH_VOIDED_CHECK',
  BANK_STATEMENT = 'BANK_STATEMENT',
  DIRECT_DEPOSIT_FORM = 'DIRECT_DEPOSIT_FORM',
}

@Entity('payment_documents', { schema: 'vantagepoint' })
@Index(['user_id'])
@Index(['type'])
@Index(['uploaded_at'])
export class PaymentDocument {
  @ApiProperty({ description: 'Payment document ID', example: 'clx1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID', example: 1 })
  @Column({ name: 'user_id', type: 'integer' })
  user_id: number;

  @ApiProperty({ 
    description: 'Document type', 
    enum: PaymentDocType,
    example: PaymentDocType.ACH_VOIDED_CHECK 
  })
  @Column({ 
    type: 'enum', 
    enum: PaymentDocType,
    default: PaymentDocType.ACH_VOIDED_CHECK 
  })
  type: PaymentDocType;

  @ApiProperty({ description: 'URL to uploaded document' })
  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @ApiPropertyOptional({ 
    description: 'Last 4 digits of account number (for verification)', 
    example: '1234' 
  })
  @Column({ type: 'varchar', length: 4, nullable: true })
  acct_last4: string;

  @ApiProperty({ description: 'Upload timestamp' })
  @CreateDateColumn({ name: 'uploaded_at' })
  uploaded_at: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Virtual properties
  @ApiProperty({ description: 'File name from URL' })
  get file_name(): string {
    return this.file_url.split('/').pop() || 'unknown';
  }

  @ApiProperty({ description: 'File extension' })
  get file_extension(): string {
    return this.file_name.split('.').pop()?.toLowerCase() || '';
  }
}
