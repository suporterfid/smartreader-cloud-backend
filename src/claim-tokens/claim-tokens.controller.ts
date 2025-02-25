// src/claim-tokens/claim-tokens.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ClaimTokensService } from './claim-tokens.service';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';

@Controller('claim-tokens')
export class ClaimTokensController {
  constructor(private readonly claimTokensService: ClaimTokensService) {}
  
  @Post()
  async generateClaimToken() {
    return this.claimTokensService.generateClaimToken();
  }
  
  @Get(':token')
  @ApiOperation({ summary: 'Verify a claim token' })
  @ApiParam({ name: 'token', description: 'Claim token string' })
  @ApiResponse({ status: 200, description: 'Claim token verified.' })
  async verifyClaimToken(@Param('token') token: string) {
    return this.claimTokensService.verifyClaimToken(token);
  }
  
  @Post('claim')
  async claimDevice(@Body('token') token: string, @Body('deviceSerial') deviceSerial: string) {
    return this.claimTokensService.claimDevice(token, deviceSerial);
  }
}
