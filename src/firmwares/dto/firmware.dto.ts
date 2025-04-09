import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFirmwareDto {
  @ApiProperty({ description: 'Firmware file name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'Firmware version' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiPropertyOptional({ description: 'Firmware description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Compatible device types' })
  @IsArray()
  @IsOptional()
  compatibleDeviceTypes?: string[];

  @ApiPropertyOptional({ description: 'Firmware category IDs' })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class UpdateFirmwareDto {
  @ApiPropertyOptional({ description: 'Firmware file name' })
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiPropertyOptional({ description: 'Firmware version' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ description: 'Firmware description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'Compatible device types' })
  @IsArray()
  @IsOptional()
  compatibleDeviceTypes?: string[];

  @ApiPropertyOptional({ description: 'Firmware category IDs' })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AssignFirmwareDto {
  @ApiProperty({ description: 'Device IDs to assign firmware to' })
  @IsArray()
  @IsNotEmpty()
  deviceIds: string[];
}

export class FirmwareUpgradeCommandDto {
  @ApiProperty({ description: 'URL to download the firmware' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Timeout in minutes for the upgrade process' })
  @IsNumber()
  @IsOptional()
  timeoutInMinutes?: number = 4;

  @ApiProperty({ description: 'Maximum number of retries' })
  @IsNumber()
  @IsOptional()
  maxRetries?: number = 3;
}
