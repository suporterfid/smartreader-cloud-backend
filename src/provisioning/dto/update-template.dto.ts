// src/provisioning/dto/update-template.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsBoolean, IsOptional, IsNumber, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class TopicPermissionDto {
  @ApiPropertyOptional({ description: 'MQTT topic pattern' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  topic?: string;

  @ApiPropertyOptional({ description: 'Permission type', enum: ['subscribe', 'publish', 'both'] })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  permission?: string;
}

class MqttConfigDto {
  @ApiPropertyOptional({ description: 'MQTT broker host' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  host?: string;

  @ApiPropertyOptional({ description: 'MQTT broker port' })
  @IsNumber()
  @IsOptional()
  port?: number;

  @ApiPropertyOptional({ description: 'Use TLS/SSL for MQTT connection' })
  @IsBoolean()
  @IsOptional()
  useTLS?: boolean;

  @ApiPropertyOptional({ description: 'MQTT topic permissions', type: [TopicPermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicPermissionDto)
  @IsOptional()
  topicPermissions?: TopicPermissionDto[];
}

export class UpdateTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'MQTT configuration', type: MqttConfigDto })
  @IsObject()
  @ValidateNested()
  @Type(() => MqttConfigDto)
  @IsOptional()
  mqttConfig?: MqttConfigDto;

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
