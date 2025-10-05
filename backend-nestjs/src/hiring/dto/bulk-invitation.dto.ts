import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvitationDto } from './create-invitation.dto';

export class BulkInvitationDto {
  @ApiProperty({
    description: 'Array of invitation data',
    type: [CreateInvitationDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one invitation is required' })
  @ArrayMaxSize(100, { message: 'Maximum 100 invitations per batch' })
  @ValidateNested({ each: true })
  @Type(() => CreateInvitationDto)
  invitations: CreateInvitationDto[];
}

export interface BulkUploadResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  invitations: Array<{
    email: string;
    status: 'success' | 'failed';
    id?: string;
    error?: string;
  }>;
}
