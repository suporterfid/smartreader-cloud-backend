import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Firmware, FirmwareDocument } from './schemas/firmware.schema';
import { FirmwareCategory, FirmwareCategoryDocument } from './schemas/firmware-category.schema';
import { CreateFirmwareDto, UpdateFirmwareDto, AssignFirmwareDto } from './dto/firmware.dto';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class FirmwaresService {
  private readonly logger = new Logger(FirmwaresService.name);
  private readonly FIRMWARE_DIR = 'uploads/firmwares';

  constructor(
    @InjectModel(Firmware.name) private firmwareModel: Model<FirmwareDocument>,
    @InjectModel(FirmwareCategory.name) private categoryModel: Model<FirmwareCategoryDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
  ) {
    // Ensure the firmware directory exists
    this.ensureFirmwareDir();
  }

  private ensureFirmwareDir() {
    if (!fs.existsSync(this.FIRMWARE_DIR)) {
      fs.mkdirSync(this.FIRMWARE_DIR, { recursive: true });
      this.logger.log(`Created firmware directory: ${this.FIRMWARE_DIR}`);
    }
  }

  async create(createFirmwareDto: CreateFirmwareDto, file?: Express.Multer.File): Promise<Firmware> {
    try {
      // Handle file storage if a file was uploaded
      let filePath = null;
      let fileSize = createFirmwareDto.fileSize;

      if (file) {
        // Generate a unique filename
        const fileExt = path.extname(file.originalname);
        const fileHash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
        const fileName = `${fileHash}${fileExt}`;
        filePath = path.join(this.FIRMWARE_DIR, fileName);

        // Save the file
        fs.writeFileSync(filePath, file.buffer);
        fileSize = file.size;
        this.logger.log(`Saved firmware file: ${filePath}`);
      }

      // Process categories if provided
      let categories = [];
      if (createFirmwareDto.categories && createFirmwareDto.categories.length > 0) {
        // Verify that all category IDs exist
        for (const categoryId of createFirmwareDto.categories) {
          const category = await this.categoryModel.findById(categoryId).exec();
          if (!category) {
            throw new BadRequestException(`Category with ID ${categoryId} not found`);
          }
          categories.push(categoryId);
        }
      }

      // Create the firmware record
      const firmware = new this.firmwareModel({
        ...createFirmwareDto,
        fileSize: fileSize || 0,
        filePath,
        categories,
        uploadDate: new Date(),
        lastUpdateDate: new Date(),
      });

      const savedFirmware = await firmware.save();
      this.logger.log(`Created firmware: ${savedFirmware._id}`);
      return savedFirmware;
    } catch (error) {
      this.logger.error(`Error creating firmware: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Firmware[]> {
    return this.firmwareModel.find().populate('categories').exec();
  }

  async findOne(id: string): Promise<Firmware> {
    const firmware = await this.firmwareModel.findById(id).populate('categories').exec();
    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }
    return firmware;
  }

  async update(id: string, updateFirmwareDto: UpdateFirmwareDto, file?: Express.Multer.File): Promise<Firmware> {
    try {
      const firmware = await this.firmwareModel.findById(id).exec();
      if (!firmware) {
        throw new NotFoundException(`Firmware with ID ${id} not found`);
      }

      // Handle file update if a new file was uploaded
      if (file) {
        // Delete the old file if it exists
        if (firmware.filePath && fs.existsSync(firmware.filePath)) {
          fs.unlinkSync(firmware.filePath);
          this.logger.log(`Deleted old firmware file: ${firmware.filePath}`);
        }

        // Generate a unique filename
        const fileExt = path.extname(file.originalname);
        const fileHash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex');
        const fileName = `${fileHash}${fileExt}`;
        const filePath = path.join(this.FIRMWARE_DIR, fileName);

        // Save the new file
        fs.writeFileSync(filePath, file.buffer);
        updateFirmwareDto.fileSize = file.size;
        firmware.filePath = filePath;
        this.logger.log(`Saved new firmware file: ${filePath}`);
      }

      // Update categories if provided
      if (updateFirmwareDto.categories) {
        // Verify that all category IDs exist
        const categories = [];
        for (const categoryId of updateFirmwareDto.categories) {
          const category = await this.categoryModel.findById(categoryId).exec();
          if (!category) {
            throw new BadRequestException(`Category with ID ${categoryId} not found`);
          }
          categories.push(categoryId);
        }
        firmware.categories = categories;
      }

      // Update other fields
      if (updateFirmwareDto.fileName) firmware.fileName = updateFirmwareDto.fileName;
      if (updateFirmwareDto.version) firmware.version = updateFirmwareDto.version;
      if (updateFirmwareDto.description !== undefined) firmware.description = updateFirmwareDto.description;
      if (updateFirmwareDto.fileSize) firmware.fileSize = updateFirmwareDto.fileSize;
      if (updateFirmwareDto.compatibleDeviceTypes) firmware.compatibleDeviceTypes = updateFirmwareDto.compatibleDeviceTypes;
      if (updateFirmwareDto.active !== undefined) firmware.active = updateFirmwareDto.active;

      firmware.lastUpdateDate = new Date();

      const updatedFirmware = await firmware.save();
      this.logger.log(`Updated firmware: ${updatedFirmware._id}`);
      return updatedFirmware;
    } catch (error) {
      this.logger.error(`Error updating firmware: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<Firmware> {
    const firmware = await this.firmwareModel.findById(id).exec();
    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    // Delete the file if it exists
    if (firmware.filePath && fs.existsSync(firmware.filePath)) {
      fs.unlinkSync(firmware.filePath);
      this.logger.log(`Deleted firmware file: ${firmware.filePath}`);
    }

    // Remove the firmware record
    const deletedFirmware = await this.firmwareModel.findByIdAndDelete(id).exec();
    this.logger.log(`Deleted firmware: ${id}`);
    return deletedFirmware;
  }

  async assignToDevices(id: string, assignDto: AssignFirmwareDto): Promise<{ success: boolean, updatedDevices: number, message: string }> {
    const firmware = await this.firmwareModel.findById(id).exec();
    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    // Check if any of the provided device IDs exist and are compatible
    const devices = await this.deviceModel.find({ 
      _id: { $in: assignDto.deviceIds } 
    }).exec();

    if (devices.length === 0) {
      throw new NotFoundException('No valid devices found with the provided IDs');
    }

    // Check if devices are compatible
    if (firmware.compatibleDeviceTypes && firmware.compatibleDeviceTypes.length > 0) {
      for (const device of devices) {
        if (!firmware.compatibleDeviceTypes.includes(device.type)) {
          this.logger.warn(`Device ${device._id} (type: ${device.type}) is not compatible with firmware ${firmware._id}`);
        }
      }
    }

    // Update each device with the firmware version
    const updateResult = await this.deviceModel.updateMany(
      { _id: { $in: assignDto.deviceIds } },
      { 
        $set: { 
          firmwareVersion: firmware.version,
          assignedFirmware: firmware._id
        }
      }
    ).exec();

    this.logger.log(`Assigned firmware ${id} to ${updateResult.modifiedCount} devices`);
    
    return {
      success: true,
      updatedDevices: updateResult.modifiedCount,
      message: `Firmware ${firmware.version} assigned to ${updateResult.modifiedCount} devices`
    };
  }

  async getFirmwareFile(id: string): Promise<{ buffer: Buffer, fileName: string, mimeType: string }> {
    const firmware = await this.firmwareModel.findById(id).exec();
    if (!firmware) {
      throw new NotFoundException(`Firmware with ID ${id} not found`);
    }

    if (!firmware.filePath || !fs.existsSync(firmware.filePath)) {
      throw new NotFoundException('Firmware file not found');
    }

    const buffer = fs.readFileSync(firmware.filePath);
    const mimeType = this.getMimeType(firmware.fileName);

    return {
      buffer,
      fileName: firmware.fileName,
      mimeType
    };
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.bin':
        return 'application/octet-stream';
      case '.hex':
        return 'application/octet-stream';
      case '.upgx': // Custom firmware extension
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}
