// src/certificates/certificates.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  UseGuards, 
  Logger,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { CertificatesService } from './certificates.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('Certificates')
@ApiSecurity('x-api-key')
@Controller('certificates')
@UseGuards(ApiKeyGuard)
export class CertificatesController {
  private readonly logger = new Logger(CertificatesController.name);

  constructor(private readonly certificatesService: CertificatesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get certificate details by ID' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate details' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async getCertificate(@Param('id') id: string) {
    try {
      const certificate = await this.certificatesService.getCertificateById(id);
      
      return {
        id: certificate._id,
        deviceSerial: certificate.deviceSerial,
        status: certificate.status,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        commonName: certificate.commonName,
        fingerprint: certificate.fingerprint,
        serialNumber: certificate.serialNumber,
        revokedAt: certificate.revokedAt,
        createdAt: certificate.createdAt,
        updatedAt: certificate.updatedAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get certificate: ${error.message}`);
    }
  }

  @Get('device/:deviceSerial')
  @ApiOperation({ summary: 'Get certificates for a device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial number' })
  @ApiResponse({ status: 200, description: 'List of certificates for device' })
  async getCertificatesForDevice(@Param('deviceSerial') deviceSerial: string) {
    try {
      const certificates = await this.certificatesService.getCertificatesForDevice(deviceSerial);
      
      return certificates.map(cert => ({
        id: cert._id,
        status: cert.status,
        validFrom: cert.validFrom,
        validTo: cert.validTo,
        commonName: cert.commonName,
        fingerprint: cert.fingerprint,
        serialNumber: cert.serialNumber,
        revokedAt: cert.revokedAt,
        createdAt: cert.createdAt,
        updatedAt: cert.updatedAt
      }));
    } catch (error) {
      throw new BadRequestException(`Failed to get certificates: ${error.message}`);
    }
  }

  @Get('device/:deviceSerial/active')
  @ApiOperation({ summary: 'Get active certificate for a device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial number' })
  @ApiResponse({ status: 200, description: 'Active certificate for device' })
  @ApiResponse({ status: 404, description: 'No active certificate found' })
  async getActiveCertificateForDevice(@Param('deviceSerial') deviceSerial: string) {
    try {
      const certificate = await this.certificatesService.getActiveCertificateForDevice(deviceSerial);
      
      return {
        id: certificate._id,
        status: certificate.status,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        commonName: certificate.commonName,
        fingerprint: certificate.fingerprint,
        serialNumber: certificate.serialNumber,
        createdAt: certificate.createdAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get active certificate: ${error.message}`);
    }
  }

  @Post('device/:deviceSerial/generate')
  @ApiOperation({ summary: 'Generate new certificate for a device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial number' })
  @ApiResponse({ status: 201, description: 'Certificate generated successfully' })
  async generateCertificate(@Param('deviceSerial') deviceSerial: string) {
    this.logger.log(`Generating certificate for device: ${deviceSerial}`);
    
    try {
      const certificate = await this.certificatesService.generateDeviceCertificate(deviceSerial);
      
      return {
        id: certificate._id,
        pem: certificate.pem,
        privateKey: certificate.privateKey,
        status: certificate.status,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        commonName: certificate.commonName,
        fingerprint: certificate.fingerprint,
        serialNumber: certificate.serialNumber
      };
    } catch (error) {
      throw new BadRequestException(`Failed to generate certificate: ${error.message}`);
    }
  }

  @Post('device/:deviceSerial/sign-csr')
  @ApiOperation({ summary: 'Sign CSR for a device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial number' })
  @ApiBody({ schema: { properties: { csr: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'CSR signed successfully' })
  async signCSR(
    @Param('deviceSerial') deviceSerial: string,
    @Body('csr') csr: string
  ) {
    if (!csr) {
      throw new BadRequestException('CSR is required');
    }
    
    this.logger.log(`Signing CSR for device: ${deviceSerial}`);
    
    try {
      const certificate = await this.certificatesService.signCSR(deviceSerial, csr);
      
      return {
        id: certificate._id,
        pem: certificate.pem,
        status: certificate.status,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        commonName: certificate.commonName,
        fingerprint: certificate.fingerprint,
        serialNumber: certificate.serialNumber
      };
    } catch (error) {
      throw new BadRequestException(`Failed to sign CSR: ${error.message}`);
    }
  }

  @Post(':id/revoke')
  @ApiOperation({ summary: 'Revoke a certificate' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({ status: 200, description: 'Certificate revoked successfully' })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  async revokeCertificate(@Param('id') id: string) {
    this.logger.log(`Revoking certificate: ${id}`);
    
    try {
      const certificate = await this.certificatesService.revokeCertificate(id);
      
      return {
        id: certificate._id,
        status: certificate.status,
        revokedAt: certificate.revokedAt
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to revoke certificate: ${error.message}`);
    }
  }

  @Post('device/:deviceSerial/renew')
  @ApiOperation({ summary: 'Renew certificate for a device' })
  @ApiParam({ name: 'deviceSerial', description: 'Device serial number' })
  @ApiResponse({ status: 201, description: 'Certificate renewed successfully' })
  async renewCertificate(@Param('deviceSerial') deviceSerial: string) {
    this.logger.log(`Renewing certificate for device: ${deviceSerial}`);
    
    try {
      const certificate = await this.certificatesService.renewCertificate(deviceSerial);
      
      return {
        id: certificate._id,
        pem: certificate.pem,
        privateKey: certificate.privateKey,
        status: certificate.status,
        validFrom: certificate.validFrom,
        validTo: certificate.validTo,
        commonName: certificate.commonName,
        fingerprint: certificate.fingerprint,
        serialNumber: certificate.serialNumber
      };
    } catch (error) {
      throw new BadRequestException(`Failed to renew certificate: ${error.message}`);
    }
  }

  @Get('ca')
  @ApiOperation({ summary: 'Get CA certificate' })
  @ApiResponse({ status: 200, description: 'CA certificate' })
  async getCACertificate() {
    try {
      const caCertificate = await this.certificatesService.getCACertificate();
      return { caCertificate };
    } catch (error) {
      throw new BadRequestException(`Failed to get CA certificate: ${error.message}`);
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a certificate' })
  @ApiBody({ schema: { properties: { certificate: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Certificate validation result' })
  async validateCertificate(@Body('certificate') certificate: string) {
    if (!certificate) {
      throw new BadRequestException('Certificate is required');
    }
    
    try {
      return this.certificatesService.validateCertificate(certificate);
    } catch (error) {
      throw new BadRequestException(`Failed to validate certificate: ${error.message}`);
    }
  }
}
