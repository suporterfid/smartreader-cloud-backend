// src/provisioning/provisioning.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomBytes } from 'crypto';
import { ProvisioningTemplate, ProvisioningTemplateDocument } from './schemas/provisioning-template.schema';
import { Device, DeviceDocument, ProvisioningStatus } from '../devices/schemas/device.schema';
import { CertificatesService } from '../certificates/certificates.service';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectModel(ProvisioningTemplate.name) private templateModel: Model<ProvisioningTemplateDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    private readonly certificatesService: CertificatesService
  ) {
    // Initialize with a default template if none exists
    this.ensureDefaultTemplate();
  }

  private async ensureDefaultTemplate(): Promise<void> {
    const count = await this.templateModel.countDocuments();
    if (count === 0) {
      this.logger.log('Creating default provisioning template');
      await this.templateModel.create({
        name: 'Default Template',
        description: 'Default provisioning template created by the system',
        mqttConfig: {
          host: 'mosquitto',
          port: 8883,
          useTLS: true,
          topicPermissions: [
            { topic: 'smartreader/+/events', permission: 'publish' },
            { topic: 'smartreader/+/command/#', permission: 'subscribe' }
          ]
        },
        parameters: {
          telemetryInterval: 60,
          logLevel: 'info'
        },
        isDefault: true
      });
    }
  }

  // Handle device "Phone Home" requests
  async handlePhoneHome(deviceSerial: string, firmwareVersion?: string): Promise<{ deviceSerial: string, claimToken: string, status: string }> {
    this.logger.log(`Handling phone home for device: ${deviceSerial}`);
    
    // Look for existing device
    let device = await this.deviceModel.findOne({ deviceSerial });
    
    if (!device) {
      // Create a new device record
      this.logger.log(`Device ${deviceSerial} not found, creating new record`);
      
      // Generate claim token
      const claimToken = this.generateClaimToken();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Token valid for 7 days
      
      device = await this.deviceModel.create({
        name: `New Device (${deviceSerial})`,
        type: 'unknown',
        deviceSerial,
        firmwareVersion,
        provisioningStatus: ProvisioningStatus.UNCLAIMED,
        claimToken,
        claimTokenExpiry: expiryDate,
        lastPhoneHome: new Date()
      });
      
      return {
        deviceSerial,
        claimToken,
        status: ProvisioningStatus.UNCLAIMED
      };
    }
    
    // Update existing device
    device.lastPhoneHome = new Date();
    if (firmwareVersion) {
      device.firmwareVersion = firmwareVersion;
    }
    
    // If device doesn't have a claim token, generate one
    if (!device.claimToken || device.claimTokenExpiry < new Date()) {
      const claimToken = this.generateClaimToken();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Token valid for 7 days
      
      device.claimToken = claimToken;
      device.claimTokenExpiry = expiryDate;
    }
    
    await device.save();
    
    return {
      deviceSerial: device.deviceSerial,
      claimToken: device.claimToken,
      status: device.provisioningStatus
    };
  }

  // Generate a random claim token
  private generateClaimToken(): string {
    return randomBytes(16).toString('hex');
  }

  // Process device claiming
  async claimDevice(deviceSerial: string, claimToken: string, userId: string): Promise<Device> {
    const device = await this.deviceModel.findOne({ deviceSerial });
    
    if (!device) {
      throw new NotFoundException(`Device with serial ${deviceSerial} not found`);
    }
    
    // Verify claim token
    if (device.claimToken !== claimToken) {
      throw new BadRequestException('Invalid claim token');
    }
    
    // Check token expiry
    if (device.claimTokenExpiry < new Date()) {
      throw new BadRequestException('Claim token has expired');
    }
    
    // Check if device is already claimed
    if (device.provisioningStatus !== ProvisioningStatus.UNCLAIMED) {
      throw new BadRequestException(`Device is already ${device.provisioningStatus}`);
    }
    
    // Update device
    device.ownerId = userId as any;
    device.provisioningStatus = ProvisioningStatus.CLAIMED;
    
    // Find default template
    const defaultTemplate = await this.templateModel.findOne({ isDefault: true });
    if (defaultTemplate) {
      device.provisioningTemplateId = defaultTemplate._id;
    }
    
    await device.save();
    return device;
  }

  // Apply provisioning template to device
  async applyTemplate(deviceId: string, templateId: string): Promise<Device> {
    const device = await this.deviceModel.findById(deviceId);
    
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }
    
    // Check if the template exists
    const template = await this.templateModel.findById(templateId);
    if (!template) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }
    
    // Update device with template
    device.provisioningTemplateId = template._id;
    
    await device.save();
    return device;
  }

  // Complete device provisioning
  async completeProvisioning(deviceId: string): Promise<Device> {
    const device = await this.deviceModel.findById(deviceId);
    
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }
    
    // Check device has a template
    if (!device.provisioningTemplateId) {
      throw new BadRequestException('Device must have a provisioning template assigned');
    }
    
    // Check device has a certificate
    if (!device.certificateId) {
      throw new BadRequestException('Device must have a certificate issued');
    }
    
    // Update device status
    device.provisioningStatus = ProvisioningStatus.PROVISIONED;
    
    await device.save();
    return device;
  }

  // Revoke a device
  async revokeDevice(deviceId: string): Promise<Device> {
    const device = await this.deviceModel.findById(deviceId);
    
    if (!device) {
      throw new NotFoundException(`Device with ID ${deviceId} not found`);
    }
    
    // Update device status
    device.provisioningStatus = ProvisioningStatus.REVOKED;
    
    // If there's a certificate, revoke it
    if (device.certificateId) {
      await this.certificatesService.revokeCertificate(device.certificateId);
    }
    
    await device.save();
    return device;
  }

  // Get all templates
  async getTemplates(): Promise<ProvisioningTemplate[]> {
    return this.templateModel.find().exec();
  }

  // Get a template by ID
  async getTemplateById(id: string): Promise<ProvisioningTemplate> {
    const template = await this.templateModel.findById(id).exec();
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return template;
  }

  // Create a new template
  async createTemplate(templateData: Partial<ProvisioningTemplate>): Promise<ProvisioningTemplate> {
    // Check if name is unique
    const existingTemplate = await this.templateModel.findOne({ name: templateData.name });
    if (existingTemplate) {
      throw new BadRequestException(`Template with name "${templateData.name}" already exists`);
    }
    
    const template = new this.templateModel(templateData);
    return template.save();
  }

  // Update a template
  async updateTemplate(id: string, templateData: Partial<ProvisioningTemplate>): Promise<ProvisioningTemplate> {
    // If updating name, check it's unique
    if (templateData.name) {
      const existingTemplate = await this.templateModel.findOne({ 
        name: templateData.name,
        _id: { $ne: id }
      });
      
      if (existingTemplate) {
        throw new BadRequestException(`Template with name "${templateData.name}" already exists`);
      }
    }
    
    const template = await this.templateModel.findByIdAndUpdate(
      id,
      templateData,
      { new: true }
    );
    
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }
    
    return template;
  }

  // Delete a template
  async deleteTemplate(id: string): Promise<{ deleted: boolean }> {
    // Check if any devices use this template
    const devicesUsingTemplate = await this.deviceModel.countDocuments({ 
      provisioningTemplateId: id 
    });
    
    if (devicesUsingTemplate > 0) {
      throw new BadRequestException(
        `Cannot delete template as it is used by ${devicesUsingTemplate} device(s)`
      );
    }
    
    // Check if it's the default template
    const template = await this.templateModel.findById(id);
    if (template && template.isDefault) {
      throw new BadRequestException('Cannot delete the default template');
    }
    
    const result = await this.templateModel.deleteOne({ _id: id });
    return { deleted: result.deletedCount > 0 };
  }

  // Get unclaimed devices
  async getUnclaimedDevices(): Promise<Device[]> {
    return this.deviceModel.find({ 
      provisioningStatus: ProvisioningStatus.UNCLAIMED 
    }).exec();
  }

  // Get claimed but not fully provisioned devices
  async getClaimedDevices(userId: string): Promise<Device[]> {
    return this.deviceModel.find({ 
      ownerId: userId,
      provisioningStatus: ProvisioningStatus.CLAIMED
    }).exec();
  }

  // Get fully provisioned devices
  async getProvisionedDevices(userId: string): Promise<Device[]> {
    return this.deviceModel.find({ 
      ownerId: userId,
      provisioningStatus: ProvisioningStatus.PROVISIONED
    }).exec();
  }

  // Get all devices grouped by status
  async getAllDevicesByStatus(userId: string): Promise<{
    unclaimed: Device[],
    claimed: Device[],
    provisioned: Device[],
    revoked: Device[]
  }> {
    const [unclaimed, claimed, provisioned, revoked] = await Promise.all([
      this.deviceModel.find({ provisioningStatus: ProvisioningStatus.UNCLAIMED }).exec(),
      this.deviceModel.find({ 
        ownerId: userId,
        provisioningStatus: ProvisioningStatus.CLAIMED 
      }).exec(),
      this.deviceModel.find({ 
        ownerId: userId,
        provisioningStatus: ProvisioningStatus.PROVISIONED 
      }).exec(),
      this.deviceModel.find({ 
        ownerId: userId,
        provisioningStatus: ProvisioningStatus.REVOKED 
      }).exec()
    ]);
    
    return { unclaimed, claimed, provisioned, revoked };
  }
}
