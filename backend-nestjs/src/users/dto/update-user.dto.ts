import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsInt, 
  IsBoolean,
  MinLength, 
  MaxLength,
  Matches,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Username (3-50 characters, alphanumeric and underscores only)',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  full_name?: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.AGENT,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role must be one of: admin, manager, agent' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Manager ID (required for agents)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  manager_id?: number;

  @ApiPropertyOptional({
    description: 'Whether user is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
