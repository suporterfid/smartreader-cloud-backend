// src/provisioning/dto/create-template.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsBoolean, IsOptional, IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class TopicPermissionDto {
  @ApiProperty({ description: 'MQTT topic pattern' })
  @IsString()
  @IsNotEmpty()
  topic: string;

  @ApiProperty({ description: 'Permission type', enum: ['subscribe', 'publish', 'both'] })
  @IsString()
  @IsNotEmpty()
  permission: string;
}

class MqttConfigDto {
  @ApiProperty({ description: 'MQTT broker host' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ description: 'MQTT broker port' })
  @IsNumber()
  port: number;

  @ApiProperty({ description: 'Use TLS/SSL for MQTT connection' })
  @IsBoolean()
  useTLS: boolean;

  @ApiPropertyOptional({ description: 'MQTT topic permissions', type: [TopicPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicPermissionDto)
  @IsOptional()
  topicPermissions?: TopicPermissionDto[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Template description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'MQTT configuration', type: MqttConfigDto })
  @IsObject()
  @ValidateNested()
  @Type(() => MqttConfigDto)
  mqttConfig: MqttConfigDto;

  @ApiPropertyOptional({ description: 'Additional parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Set as default template' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Template is active' })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
