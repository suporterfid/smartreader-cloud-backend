import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeviceGroup, DeviceGroupDocument } from './schemas/device-group.schema';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';
import { Command, CommandDocument } from '../commands/schemas/command.schema';
import { MqttService } from '../mqtt/mqtt.service';
import { 
  CreateDeviceGroupDto, 
  UpdateDeviceGroupDto, 
  AddDeviceToGroupDto, 
  RemoveDeviceFromGroupDto,
  GroupCommandDto 
} from './dto/device-group.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DeviceGroupsService {
  private readonly logger = new Logger(DeviceGroupsService.name);

  constructor(
    @InjectModel(DeviceGroup.name) private groupModel: Model<DeviceGroupDocument>,
    @InjectModel(Device.name) private deviceModel: Model<DeviceDocument>,
    @InjectModel(Command.name) private commandModel: Model<CommandDocument>,
    private readonly mqttService: MqttService,
  ) {}

  async create(createGroupDto: CreateDeviceGroupDto): Promise<DeviceGroup> {
    try {
      // Check if group with the same name already exists
      const existingGroup = await this.groupModel.findOne({ name: createGroupDto.name }).exec();
      if (existingGroup) {
        throw new BadRequestException(`Group with name '${createGroupDto.name}' already exists`);
      }

      // Verify that all device IDs exist
      if (createGroupDto.deviceIds && createGroupDto.deviceIds.length > 0) {
        const devices = await this.deviceModel.find({ 
          _id: { $in: createGroupDto.deviceIds } 
        }).exec();

        if (devices.length !== createGroupDto.deviceIds.length) {
          throw new BadRequestException('One or more device IDs are invalid');
        }
      }

      // Create the group
      const group = new this.groupModel({
        name: createGroupDto.name,
        description: createGroupDto.description,
        devices: createGroupDto.deviceIds || [],
        tags: createGroupDto.tags || [],
        active: createGroupDto.active !== undefined ? createGroupDto.active : true,
        metadata: createGroupDto.metadata || {},
      });

      return await group.save();
    } catch (error) {
      this.logger.error(`Error creating device group: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<DeviceGroup[]> {
    return this.groupModel.find().populate('devices').exec();
  }

  async findOne(id: string): Promise<DeviceGroup> {
    const group = await this.groupModel.findById(id).populate('devices').exec();
    if (!group) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }
    return group;
  }

  async update(id: string, updateGroupDto: UpdateDeviceGroupDto): Promise<DeviceGroup> {
    try {
      // Check if group exists
      const group = await this.groupModel.findById(id).exec();
      if (!group) {
        throw new NotFoundException(`Device group with ID ${id} not found`);
      }

      // If updating the name, check if the new name already exists
      if (updateGroupDto.name && updateGroupDto.name !== group.name) {
        const existingGroup = await this.groupModel.findOne({ name: updateGroupDto.name }).exec();
        if (existingGroup && existingGroup._id.toString() !== id) {
          throw new BadRequestException(`Group with name '${updateGroupDto.name}' already exists`);
        }
      }

      // Verify that all device IDs exist if provided
      if (updateGroupDto.deviceIds && updateGroupDto.deviceIds.length > 0) {
        const devices = await this.deviceModel.find({ 
          _id: { $in: updateGroupDto.deviceIds } 
        }).exec();

        if (devices.length !== updateGroupDto.deviceIds.length) {
          throw new BadRequestException('One or more device IDs are invalid');
        }
      }

      // Update the group
      const updatedGroup = await this.groupModel.findByIdAndUpdate(
        id,
        { 
          ...updateGroupDto,
          devices: updateGroupDto.deviceIds || group.devices,
        },
        { new: true }
      ).exec();

      return updatedGroup;
    } catch (error) {
      this.logger.error(`Error updating device group: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<DeviceGroup> {
    const deletedGroup = await this.groupModel.findByIdAndDelete(id).exec();
    if (!deletedGroup) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }
    return deletedGroup;
  }

  async addDevicesToGroup(id: string, addDeviceDto: AddDeviceToGroupDto): Promise<DeviceGroup> {
    // Check if group exists
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }

    // Verify that all device IDs exist
    const devices = await this.deviceModel.find({ 
      _id: { $in: addDeviceDto.deviceIds } 
    }).exec();

    if (devices.length !== addDeviceDto.deviceIds.length) {
      throw new BadRequestException('One or more device IDs are invalid');
    }

    // Add devices to the group (avoiding duplicates)
    const currentDeviceIds = group.devices.map(d => d.toString());
    const newDeviceIds = addDeviceDto.deviceIds.filter(id => !currentDeviceIds.includes(id));
    
    if (newDeviceIds.length === 0) {
      return group; // No new devices to add
    }

    // Update the group with the new devices
    const updatedGroup = await this.groupModel.findByIdAndUpdate(
      id,
      { $push: { devices: { $each: newDeviceIds } } },
      { new: true }
    ).populate('devices').exec();

    return updatedGroup;
  }

  async removeDevicesFromGroup(id: string, removeDeviceDto: RemoveDeviceFromGroupDto): Promise<DeviceGroup> {
    // Check if group exists
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }

    // Remove devices from the group
    const updatedGroup = await this.groupModel.findByIdAndUpdate(
      id,
      { $pull: { devices: { $in: removeDeviceDto.deviceIds } } },
      { new: true }
    ).populate('devices').exec();

    return updatedGroup;
  }

  async sendCommandToGroup(id: string, commandDto: GroupCommandDto): Promise<any> {
    // Check if group exists
    const group = await this.groupModel.findById(id).populate('devices').exec();
    if (!group) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }

    if (!group.devices || group.devices.length === 0) {
      throw new BadRequestException('Group has no devices to send commands to');
    }

    // Generate a unique group command ID
    const groupCommandId = uuidv4();
    const results = [];
    const commands = [];

    // Send command to each device in the group
    for (const device of group.devices) {
      try {
        // Generate a unique command ID for each device
        const commandId = uuidv4();
        
        // Create command payload
        const commandPayload = {
          command: commandDto.command,
          command_id: commandId,
          group_command_id: groupCommandId, // Add reference to group command
          payload: commandDto.payload
        };

        // Create command record
        const command = {
          command_id: commandId,
          group_command_id: groupCommandId,
          type: commandDto.type,
          deviceSerial: device['deviceSerial'],
          payload: commandPayload,
          status: 'pending',
          priority: commandDto.priority || 'medium',
        };
        
        commands.push(command);

        // Send command via MQTT
        if (commandDto.type === 'control') {
          this.mqttService.publishControlCommand(device['deviceSerial'], commandPayload);
        } else if (commandDto.type === 'management') {
          this.mqttService.publishManagementCommand(device['deviceSerial'], commandPayload);
        } else {
          throw new BadRequestException(`Invalid command type: ${commandDto.type}`);
        }

        results.push({
          deviceSerial: device['deviceSerial'],
          deviceName: device['name'],
          commandId,
          status: 'sent'
        });
      } catch (error) {
        this.logger.error(`Error sending command to device ${device['deviceSerial']}: ${error.message}`, error.stack);
        
        results.push({
          deviceSerial: device['deviceSerial'],
          deviceName: device['name'],
          status: 'error',
          error: error.message
        });
      }
    }

    // Store all commands in the database
    await this.commandModel.insertMany(commands);

    return {
      groupCommandId,
      groupName: group.name,
      command: commandDto.command,
      type: commandDto.type,
      sentAt: new Date(),
      totalDevices: group.devices.length,
      successCount: results.filter(r => r.status === 'sent').length,
      errorCount: results.filter(r => r.status === 'error').length,
      results
    };
  }

  async getGroupCommandHistory(id: string, filter?: any): Promise<any> {
    // Check if group exists
    const group = await this.groupModel.findById(id).exec();
    if (!group) {
      throw new NotFoundException(`Device group with ID ${id} not found`);
    }

    // Get all devices in the group
    const groupWithDevices = await this.groupModel.findById(id).populate('devices').exec();
    const deviceSerials = groupWithDevices.devices.map(device => device['deviceSerial']);

    // Build the filter for command history
    const commandFilter: any = {
      deviceSerial: { $in: deviceSerials },
    };

    // Add additional filters if provided
    if (filter) {
      if (filter.type) commandFilter.type = filter.type;
      if (filter.status) commandFilter.status = filter.status;
      if (filter.from || filter.to) {
        commandFilter.createdAt = {};
        if (filter.from) commandFilter.createdAt.$gte = new Date(filter.from);
        if (filter.to) commandFilter.createdAt.$lte = new Date(filter.to);
      }
    }

    // Get commands with the group_command_id field
    const commands = await this.commandModel.find(commandFilter).sort({ createdAt: -1 }).exec();

    // Group commands by group_command_id
    const groupedCommands = {};
    for (const command of commands) {
      if (command['group_command_id']) {
        if (!groupedCommands[command['group_command_id']]) {
          groupedCommands[command['group_command_id']] = {
            groupCommandId: command['group_command_id'],
            type: command.type,
            command: command.payload?.command,
            sentAt: command.createdAt,
            devices: [],
            statuses: {
              pending: 0,
              processing: 0,
              completed: 0,
              failed: 0,
              'timed-out': 0
            }
          };
        }
        
        groupedCommands[command['group_command_id']].devices.push({
          deviceSerial: command.deviceSerial,
          commandId: command.command_id,
          status: command.status,
          createdAt: command.createdAt,
          response: command.response
        });
        
        // Increment status count
        const status = command.status || 'pending';
        groupedCommands[command['group_command_id']].statuses[status] = 
          (groupedCommands[command['group_command_id']].statuses[status] || 0) + 1;
      }
    }

    return Object.values(groupedCommands);
  }

  async getGroupCommandDetails(groupCommandId: string): Promise<any> {
    // Find all commands with this group command ID
    const commands = await this.commandModel.find({ 
      group_command_id: groupCommandId 
    }).sort({ createdAt: -1 }).exec();

    if (commands.length === 0) {
      throw new NotFoundException(`Group command with ID ${groupCommandId} not found`);
    }

    // Calculate status summary
    const statusSummary = {
      total: commands.length,
      pending: 0,
      processing: 0,
      success: 0,
      error: 0,
      'timed-out': 0
    };

    for (const command of commands) {
      const status = command.status || 'pending';
      statusSummary[status] = (statusSummary[status] || 0) + 1;
    }

    // Get the first command to extract common information
    const firstCommand = commands[0];

    return {
      groupCommandId,
      type: firstCommand.type,
      command: firstCommand.payload?.command,
      payload: firstCommand.payload?.payload,
      sentAt: firstCommand.createdAt,
      statusSummary,
      commands: commands.map(cmd => ({
        deviceSerial: cmd.deviceSerial,
        commandId: cmd.command_id,
        status: cmd.status,
        createdAt: cmd.createdAt,
        executedAt: cmd.executedAt,
        response: cmd.response
      }))
    };
  }
}
