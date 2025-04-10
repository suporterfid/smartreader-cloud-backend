import { IsString, IsNotEmpty, IsArray, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDeviceGroupDto {
  @ApiProperty({ description: 'Group name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Device IDs to add to the group' })
  @IsArray()
  @IsOptional()
  deviceIds?: string[];

  @ApiPropertyOptional({ description: 'Tags for filtering and organizing groups' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateDeviceGroupDto {
  @ApiPropertyOptional({ description: 'Group name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Device IDs to set for the group (replaces existing devices)' })
  @IsArray()
  @IsOptional()
  deviceIds?: string[];

  @ApiPropertyOptional({ description: 'Tags for filtering and organizing groups' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AddDeviceToGroupDto {
  @ApiProperty({ description: 'Device IDs to add to the group' })
  @IsArray()
  @IsNotEmpty()
  deviceIds: string[];
}

export class RemoveDeviceFromGroupDto {
  @ApiProperty({ description: 'Device IDs to remove from the group' })
  @IsArray()
  @IsNotEmpty()
  deviceIds: string[];
}

export class GroupCommandDto {
  @ApiProperty({ description: 'Command type (e.g., control, management)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Command name' })
  @IsString()
  @IsNotEmpty()
  command: string;

  @ApiProperty({ description: 'Command payload' })
  @IsObject()
  payload: Record<string, any>;

  @ApiPropertyOptional({ description: 'Priority (high, medium, low)' })
  @IsString()
  @IsOptional()
  priority?: string;
}
