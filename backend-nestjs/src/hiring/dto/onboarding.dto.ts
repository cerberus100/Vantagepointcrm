import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsIP, MinLength, MaxLength } from 'class-validator';
import { DocType } from '../entities/signature.entity';
import { PaymentDocType } from '../entities/payment-document.entity';

export class SignatureDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocType,
    example: DocType.W9,
  })
  @IsString()
  docType: DocType;

  @ApiProperty({
    description: 'Envelope ID from e-sign provider',
    example: 'env_1234567890',
  })
  @IsString()
  envelopeId: string;

  @ApiPropertyOptional({
    description: 'URL to signed document',
    example: 'https://s3.amazonaws.com/bucket/signed-doc.pdf',
  })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class PaymentUploadDto {
  @ApiProperty({
    description: 'Document type',
    enum: PaymentDocType,
    example: PaymentDocType.ACH_VOIDED_CHECK,
  })
  @IsString()
  type: PaymentDocType;

  @ApiProperty({
    description: 'URL to uploaded document',
    example: 'https://s3.amazonaws.com/bucket/voided-check.pdf',
  })
  @IsString()
  fileUrl: string;

  @ApiPropertyOptional({
    description: 'Last 4 digits of account number (optional)',
    example: '1234',
    minLength: 4,
    maxLength: 4,
  })
  @IsOptional()
  @IsString()
  acctLast4?: string;
}

export class TrainingDto {
  @ApiProperty({
    description: 'Training quiz score (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0, { message: 'Score must be at least 0' })
  @Max(100, { message: 'Score must be at most 100' })
  score: number;

  @ApiProperty({
    description: 'Attestation text',
    example: 'I acknowledge that I have read and understand the compliance requirements.',
  })
  @IsString()
  attestation: string;

  @ApiPropertyOptional({
    description: 'IP address when attestation was signed',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ipAddr?: string;
}

export class CreateCredentialsDto {
  @ApiProperty({
    description: 'Username for the new account',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must not exceed 50 characters' })
  username: string;

  @ApiProperty({
    description: 'Password for the new account',
    example: 'SecurePassword123!',
    minLength: 12,
  })
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  password: string;

  @ApiProperty({
    description: 'Confirmation of password',
    example: 'SecurePassword123!',
  })
  @IsString()
  confirmPassword: string;
}
