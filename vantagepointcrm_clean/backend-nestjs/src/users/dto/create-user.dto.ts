import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsEmail, 
  IsEnum, 
  IsOptional, 
  IsInt, 
  MinLength, 
  MaxLength,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username (3-50 characters, alphanumeric and underscores only)',
    example: 'john.doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'Username can only contain letters, numbers, dots, underscores, and hyphens',
  })
  username: string;

  @ApiProperty({
    description: 'Password (minimum 12 characters)',
    example: 'SecurePassword123!',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  password: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  full_name: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    example: UserRole.AGENT,
  })
  @IsEnum(UserRole, { message: 'Role must be one of: admin, manager, agent' })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Manager ID (required for agents)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  manager_id?: number;
}
