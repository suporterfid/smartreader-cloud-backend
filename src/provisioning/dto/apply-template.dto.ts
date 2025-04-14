// src/provisioning/dto/apply-template.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApplyTemplateDto {
  @ApiProperty({ description: 'Provisioning template ID' })
  @IsString()
  @IsNotEmpty()
  templateId: string;
}
