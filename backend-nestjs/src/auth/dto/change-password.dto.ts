import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'currentPassword123!',
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 12 characters)',
    example: 'newSecurePassword456!',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  newPassword: string;
}
