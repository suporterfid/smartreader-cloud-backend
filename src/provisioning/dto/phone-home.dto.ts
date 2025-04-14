// src/provisioning/dto/phone-home.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class PhoneHomeDto {
  @ApiProperty({ description: 'Device serial number' })
  @IsString()
  @IsNotEmpty()
  deviceSerial: string;

  @ApiPropertyOptional({ description: 'Current firmware version' })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;

  @ApiPropertyOptional({ description: 'Device hardware information' })
  @IsString()
  @IsOptional()
  hardwareInfo?: string;

  @ApiPropertyOptional({ description: 'Current network configuration' })
  @IsOptional()
  networkConfig?: Record<string, any>;
}