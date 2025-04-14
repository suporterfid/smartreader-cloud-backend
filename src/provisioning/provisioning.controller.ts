// src/provisioning/provisioning.controller.ts
import { 
  Controller,
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  Logger,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ProvisioningService } from './provisioning.service';
import { CertificatesService } from '../certificates/certificates.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { Public } from '../auth/public.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PhoneHomeDto } from './dto/phone-home.dto';
import { ClaimDeviceDto } from './dto/claim-device.dto';
import { ApplyTemplateDto } from './dto/apply-template.dto';

@ApiTags('Provisioning')
@ApiSecurity('x-api-key')
@Controller('provisioning')
@UseGuards(ApiKeyGuard)
export class ProvisioningController {
  private readonly logger = new Logger(ProvisioningController.name);

  constructor(
    private readonly provisioningService: ProvisioningService,
    private readonly certificatesService: CertificatesService
  ) {}

  // Device "Phone Home" endpoint - accessible without authentication
  @Public()
  @Post('phonehome')
  @ApiOperation({ summary: 'Device phone home endpoint' })
  @ApiBody({ type: PhoneHomeDto })
  @ApiResponse({ status: 200, description: 'Device recognized and updated' })
  async phoneHome(@Body() phoneHomeDto: PhoneHomeDto) {
    this.logger.log(`Phone home request from device: ${phoneHomeDto.deviceSerial}`);
    
    return this.provisioningService.handlePhoneHome(
      phoneHomeDto.deviceSerial,
      phoneHomeDto.firmwareVersion
    );
  }

  // Claim a device
  @Post('claim')
  @ApiOperation({ summary: 'Claim an unclaimed device' })
  @ApiBody({ type: ClaimDeviceDto })
  @ApiResponse({ status: 200, description: 'Device claimed successfully' })
  async claimDevice(@Body() claimDeviceDto: ClaimDeviceDto, @Request() req) {
    this.logger.log(`Claim request for device: ${claimDeviceDto.deviceSerial}`);
    
    // In a real authentication system, get the user ID from the authenticated user
    // For now, we'll use a placeholder or the API key
    const userId = req.user?.id || 'placeholder-user-id';
    
    return this.provisioningService.claimDevice(
      claimDeviceDto.deviceSerial,
      claimDeviceDto.claimToken,
      userId
    );
  }

  // Apply provisioning template to device
  @Post('device/:deviceId/apply-template')
  @ApiOperation({ summary: 'Apply provisioning template to device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiBody({ type: ApplyTemplateDto })
  @ApiResponse({ status: 200, description: 'Template applied successfully' })
  async applyTemplate(
    @Param('deviceId') deviceId: string,
    @Body() applyTemplateDto: ApplyTemplateDto
  ) {
    this.logger.log(`Applying template ${applyTemplateDto.templateId} to device ${deviceId}`);
    
    return this.provisioningService.applyTemplate(
      deviceId,
      applyTemplateDto.templateId
    );
  }

  // Complete device provisioning
  @Post('device/:deviceId/complete')
  @ApiOperation({ summary: 'Complete device provisioning' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Provisioning completed successfully' })
  async completeProvisioning(@Param('deviceId') deviceId: string) {
    this.logger.log(`Completing provisioning for device ${deviceId}`);
    
    return this.provisioningService.completeProvisioning(deviceId);
  }

  // Revoke a device
  @Post('device/:deviceId/revoke')
  @ApiOperation({ summary: 'Revoke a device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Device revoked successfully' })
  async revokeDevice(@Param('deviceId') deviceId: string) {
    this.logger.log(`Revoking device ${deviceId}`);
    
    return this.provisioningService.revokeDevice(deviceId);
  }

  // Generate certificate for device
  @Post('device/:deviceId/generate-certificate')
  @ApiOperation({ summary: 'Generate certificate for device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiResponse({ status: 200, description: 'Certificate generated successfully' })
  async generateCertificate(@Param('deviceId') deviceId: string) {
    this.logger.log(`Generating certificate for device ${deviceId}`);
    
    // For simplicity, we're assuming deviceId is the device serial
    const certificate = await this.certificatesService.generateDeviceCertificate(deviceId);
    
    return {
      certificateId: certificate._id,
      pem: certificate.pem,
      privateKey: certificate.privateKey,
      validFrom: certificate.validFrom,
      validTo: certificate.validTo
    };
  }

  // Sign CSR for device
  @Post('device/:deviceId/sign-csr')
  @ApiOperation({ summary: 'Sign CSR for device' })
  @ApiParam({ name: 'deviceId', description: 'Device ID' })
  @ApiBody({ schema: { properties: { csr: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'CSR signed successfully' })
  async signCSR(
    @Param('deviceId') deviceId: string,
    @Body('csr') csr: string
  ) {
    if (!csr) {
      throw new BadRequestException('CSR is required');
    }
    
    this.logger.log(`Signing CSR for device ${deviceId}`);
    
    const certificate = await this.certificatesService.signCSR(deviceId, csr);
    
    return {
      certificateId: certificate._id,
      pem: certificate.pem,
      validFrom: certificate.validFrom,
      validTo: certificate.validTo
    };
  }

  // Get CA certificate
  @Get('ca-certificate')
  @ApiOperation({ summary: 'Get CA certificate' })
  @ApiResponse({ status: 200, description: 'CA certificate' })
  async getCACertificate() {
    this.logger.log('Getting CA certificate');
    
    const caCertificate = await this.certificatesService.getCACertificate();
    
    return { caCertificate };
  }

  // Get all templates
  @Get('templates')
  @ApiOperation({ summary: 'Get all provisioning templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async getTemplates() {
    return this.provisioningService.getTemplates();
  }

  // Get a template by ID
  @Get('templates/:id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  async getTemplate(@Param('id') id: string) {
    return this.provisioningService.getTemplateById(id);
  }

  // Create a new template
  @Post('templates')
  @ApiOperation({ summary: 'Create a new provisioning template' })
  @ApiBody({ type: CreateTemplateDto })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    this.logger.log(`Creating template: ${createTemplateDto.name}`);
    
    return this.provisioningService.createTemplate(createTemplateDto);
  }

  // Update a template
  @Put('templates/:id')
  @ApiOperation({ summary: 'Update a provisioning template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiBody({ type: UpdateTemplateDto })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto
  ) {
    this.logger.log(`Updating template ${id}`);
    
    return this.provisioningService.updateTemplate(id, updateTemplateDto);
  }

  // Delete a template
  @Delete('templates/:id')
  @ApiOperation({ summary: 'Delete a provisioning template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string) {
    this.logger.log(`Deleting template ${id}`);
    
    return this.provisioningService.deleteTemplate(id);
  }

  // Get unclaimed devices
  @Get('unclaimed-devices')
  @ApiOperation({ summary: 'Get unclaimed devices' })
  @ApiResponse({ status: 200, description: 'List of unclaimed devices' })
  async getUnclaimedDevices() {
    return this.provisioningService.getUnclaimedDevices();
  }

  // Get devices by status
  @Get('devices-by-status')
  @ApiOperation({ summary: 'Get devices grouped by status' })
  @ApiResponse({ status: 200, description: 'Devices grouped by status' })
  async getDevicesByStatus(@Request() req) {
    // In a real authentication system, get the user ID from the authenticated user
    const userId = req.user?.id || 'placeholder-user-id';
    
    return this.provisioningService.getAllDevicesByStatus(userId);
  }
}
