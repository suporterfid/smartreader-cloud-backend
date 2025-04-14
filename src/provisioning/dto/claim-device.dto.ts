// src/provisioning/dto/claim-device.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ClaimDeviceDto {
  @ApiProperty({ description: 'Device serial number' })
  @IsString()
  @IsNotEmpty()
  deviceSerial: string;

  @ApiProperty({ description: 'Claim token received during phone home' })
  @IsString()
  @IsNotEmpty()
  claimToken: string;
}
