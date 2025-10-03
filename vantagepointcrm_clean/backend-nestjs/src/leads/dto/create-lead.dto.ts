import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEnum, 
  IsOptional, 
  IsInt, 
  IsEmail,
  MinLength, 
  MaxLength,
  Min,
  Max,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { LeadStatus, LeadPriority, LeadType } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({
    description: 'Practice name',
    example: 'Advanced Cardiology Center',
    minLength: 3,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  practice_name: string;

  @ApiPropertyOptional({
    description: 'NPI number (10 digits)',
    example: '1234567890',
    minLength: 10,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  @Matches(/^\d{10}$/, {
    message: 'NPI must be exactly 10 digits',
  })
  npi?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '(555) 123-4567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\(\d{3}\) \d{3}-\d{4}$/, {
    message: 'Phone number must be in format (XXX) XXX-XXXX',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@cardiology.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'State code (2 characters)',
    example: 'CA',
    minLength: 2,
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Los Angeles',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Medical Drive',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Lead score (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({
    description: 'Lead status',
    enum: LeadStatus,
    example: LeadStatus.NEW,
  })
  @IsOptional()
  @IsEnum(LeadStatus, { message: 'Invalid lead status' })
  status?: LeadStatus;

  @ApiPropertyOptional({
    description: 'Lead priority',
    enum: LeadPriority,
    example: LeadPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(LeadPriority, { message: 'Invalid lead priority' })
  priority?: LeadPriority;

  @ApiPropertyOptional({
    description: 'Lead type',
    enum: LeadType,
    example: LeadType.MEDICARE,
  })
  @IsOptional()
  @IsEnum(LeadType, { message: 'Invalid lead type' })
  lead_type?: LeadType;

  @ApiPropertyOptional({
    description: 'Assigned user ID',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  assigned_user_id?: number;
}
