// src/certificates/certificates.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import * as forge from 'node-forge';
import { Certificate, CertificateDocument, CertificateStatus } from './schemas/certificate.schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const mkdirAsync = promisify(fs.mkdir);

@Injectable()
export class CertificatesService {
  private readonly logger = new Logger(CertificatesService.name);
  private readonly CA_PATH = process.env.CA_PATH || '/certs/ca';
  private readonly DEVICE_CERT_PATH = process.env.DEVICE_CERT_PATH || '/certs/devices';

  constructor(
    @InjectModel(Certificate.name) private certificateModel: Model<CertificateDocument>
  ) {
    // Ensure certificate directories exist
    this.ensureCertDirectories();
  }

  private async ensureCertDirectories(): Promise<void> {
    try {
      // Ensure CA directory exists
      await mkdirAsync(this.CA_PATH, { recursive: true });
      
      // Ensure device certs directory exists
      await mkdirAsync(this.DEVICE_CERT_PATH, { recursive: true });
      
      this.logger.log('Certificate directories ensured');
    } catch (error) {
      this.logger.error(`Error ensuring certificate directories: ${error.message}`, error.stack);
    }
  }

  // Generate a self-signed CA if one doesn't exist
  async ensureCA(): Promise<{ caCert: string, caKey: string }> {
    const caKeyPath = path.join(this.CA_PATH, 'ca.key');
    const caCertPath = path.join(this.CA_PATH, 'ca.crt');
    
    try {
      // Check if CA files already exist
      if (fs.existsSync(caKeyPath) && fs.existsSync(caCertPath)) {
        this.logger.log('CA files already exist, using existing CA');
        const caCert = await readFileAsync(caCertPath, 'utf8');
        const caKey = await readFileAsync(caKeyPath, 'utf8');
        return { caCert, caKey };
      }
      
      this.logger.log('Generating new CA certificate');
      
      // Generate a new CA key
      await execAsync(`openssl genrsa -out ${caKeyPath} 4096`);
      
      // Generate a self-signed CA certificate
      await execAsync(`openssl req -x509 -new -nodes -key ${caKeyPath} -sha256 -days 3650 -out ${caCertPath} -subj "/CN=SmartReaderCA/O=SmartReader/C=US"`);
      
      const caCert = await readFileAsync(caCertPath, 'utf8');
      const caKey = await readFileAsync(caKeyPath, 'utf8');
      
      return { caCert, caKey };
    } catch (error) {
      this.logger.error(`Error ensuring CA: ${error.message}`, error.stack);
      throw new Error(`Failed to ensure CA: ${error.message}`);
    }
  }

  // Generates a new device certificate signed by our CA
  async generateDeviceCertificate(deviceSerial: string): Promise<Certificate> {
    try {
      // Make sure we have a CA
      const { caCert, caKey } = await this.ensureCA();
      
      // Prepare CSR data
      const commonName = `device-${deviceSerial}`;
      const keyPath = path.join(this.DEVICE_CERT_PATH, `${deviceSerial}.key`);
      const csrPath = path.join(this.DEVICE_CERT_PATH, `${deviceSerial}.csr`);
      const certPath = path.join(this.DEVICE_CERT_PATH, `${deviceSerial}.crt`);
      const caKeyPath = path.join(this.CA_PATH, 'ca.key');
      const caCertPath = path.join(this.CA_PATH, 'ca.crt');
      
      // Generate device private key
      await execAsync(`openssl genrsa -out ${keyPath} 2048`);
      
      // Generate CSR
      await execAsync(`openssl req -new -key ${keyPath} -out ${csrPath} -subj "/CN=${commonName}/O=SmartReader Device/C=US"`);
      
      // Sign CSR with CA
      await execAsync(`openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} -CAcreateserial -out ${certPath} -days 365 -sha256`);
      
      // Read the generated files
      const deviceKey = await readFileAsync(keyPath, 'utf8');
      const deviceCert = await readFileAsync(certPath, 'utf8');
      
      // Extract certificate details
      const certObj = forge.pki.certificateFromPem(deviceCert);
      const fingerprint = forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(certObj)).getBytes()).digest().toHex();
      const serialNumber = certObj.serialNumber;
      
      // Calculate validity dates
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1); // 1 year validity
      
      // Create certificate record
      const certificate = new this.certificateModel({
        deviceSerial,
        pem: deviceCert,
        privateKey: deviceKey,
        status: CertificateStatus.ACTIVE,
        validFrom,
        validTo,
        commonName,
        fingerprint,
        serialNumber
      });
      
      await certificate.save();
      
      return certificate;
    } catch (error) {
      this.logger.error(`Error generating device certificate: ${error.message}`, error.stack);
      throw new Error(`Failed to generate device certificate: ${error.message}`);
    }
  }

  // Process a Certificate Signing Request (CSR) from a device
  async signCSR(deviceSerial: string, csr: string): Promise<Certificate> {
    try {
      // Make sure we have a CA
      const { caCert, caKey } = await this.ensureCA();
      
      // Save CSR to file
      const csrPath = path.join(this.DEVICE_CERT_PATH, `${deviceSerial}.csr`);
      const certPath = path.join(this.DEVICE_CERT_PATH, `${deviceSerial}.crt`);
      const caKeyPath = path.join(this.CA_PATH, 'ca.key');
      const caCertPath = path.join(this.CA_PATH, 'ca.crt');
      
      await writeFileAsync(csrPath, csr);
      
      // Sign CSR with our CA
      await execAsync(`openssl x509 -req -in ${csrPath} -CA ${caCertPath} -CAkey ${caKeyPath} -CAcreateserial -out ${certPath} -days 365 -sha256`);
      
      // Read the generated certificate
      const deviceCert = await readFileAsync(certPath, 'utf8');
      
      // Extract certificate details
      const certObj = forge.pki.certificateFromPem(deviceCert);
      const fingerprint = forge.md.sha1.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(certObj)).getBytes()).digest().toHex();
      const serialNumber = certObj.serialNumber;
      const commonName = certObj.subject.getField('CN')?.value;
      
      // Calculate validity dates
      const validFrom = new Date();
      const validTo = new Date();
      validTo.setFullYear(validTo.getFullYear() + 1); // 1 year validity
      
      // Create certificate record
      const certificate = new this.certificateModel({
        deviceSerial,
        pem: deviceCert,
        // No private key stored since the device generated it
        status: CertificateStatus.ACTIVE,
        validFrom,
        validTo,
        commonName,
        fingerprint,
        serialNumber
      });
      
      await certificate.save();
      
      return certificate;
    } catch (error) {
      this.logger.error(`Error signing CSR: ${error.message}`, error.stack);
      throw new Error(`Failed to sign CSR: ${error.message}`);
    }
  }

  // Get a certificate by ID
  async getCertificateById(id: string): Promise<Certificate> {
    const certificate = await this.certificateModel.findById(id).exec();
    
    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${id} not found`);
    }
    
    return certificate;
  }

  // Get certificates for a device
  async getCertificatesForDevice(deviceSerial: string): Promise<Certificate[]> {
    return this.certificateModel.find({ deviceSerial }).sort({ validFrom: -1 }).exec();
  }

  // Get active certificate for a device
  async getActiveCertificateForDevice(deviceSerial: string): Promise<Certificate> {
    const certificate = await this.certificateModel.findOne({ 
      deviceSerial, 
      status: CertificateStatus.ACTIVE,
      validTo: { $gt: new Date() } // Not expired
    }).exec();
    
    if (!certificate) {
      throw new NotFoundException(`No active certificate found for device ${deviceSerial}`);
    }
    
    return certificate;
  }

  // Revoke a certificate
  async revokeCertificate(certificateId: string): Promise<Certificate> {
    const certificate = await this.certificateModel.findById(certificateId).exec();
    
    if (!certificate) {
      throw new NotFoundException(`Certificate with ID ${certificateId} not found`);
    }
    
    certificate.status = CertificateStatus.REVOKED;
    certificate.revokedAt = new Date();
    
    await certificate.save();
    
    // In a production environment, you'd also want to update a CRL (Certificate Revocation List)
    // or implement OCSP (Online Certificate Status Protocol)
    
    return certificate;
  }

  // Renew a certificate
  async renewCertificate(deviceSerial: string): Promise<Certificate> {
    // First, revoke the current active certificate if there is one
    try {
      const activeCert = await this.getActiveCertificateForDevice(deviceSerial);
      await this.revokeCertificate(activeCert._id);
    } catch (error) {
      // If no active certificate exists, just proceed with generating a new one
      this.logger.log(`No active certificate to revoke for device ${deviceSerial}`);
    }
    
    // Generate a new certificate
    return this.generateDeviceCertificate(deviceSerial);
  }

  // Get the CA certificate (public part only)
  async getCACertificate(): Promise<string> {
    const caCertPath = path.join(this.CA_PATH, 'ca.crt');
    
    if (!fs.existsSync(caCertPath)) {
      // Generate the CA if it doesn't exist
      await this.ensureCA();
    }
    
    return readFileAsync(caCertPath, 'utf8');
  }

  // Check if a certificate is valid and not revoked
  async validateCertificate(pem: string): Promise<{ valid: boolean, reason?: string }> {
    try {
      // Parse the certificate
      const cert = forge.pki.certificateFromPem(pem);
      
      // Extract the serial number
      const serialNumber = cert.serialNumber;
      
      // Check if the certificate exists in our database
      const certificate = await this.certificateModel.findOne({
        serialNumber,
        pem // Double check the PEM matches
      });
      
      if (!certificate) {
        return { valid: false, reason: 'Certificate not found in database' };
      }
      
      // Check if it's revoked
      if (certificate.status === CertificateStatus.REVOKED) {
        return { valid: false, reason: 'Certificate has been revoked' };
      }
      
      // Check if it's expired
      const now = new Date();
      if (certificate.validTo < now) {
        return { valid: false, reason: 'Certificate has expired' };
      }
      
      // Check if it's not yet valid
      if (certificate.validFrom > now) {
        return { valid: false, reason: 'Certificate is not yet valid' };
      }
      
      return { valid: true };
    } catch (error) {
      this.logger.error(`Error validating certificate: ${error.message}`, error.stack);
      return { valid: false, reason: `Failed to validate certificate: ${error.message}` };
    }
  }
}
    