import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { DeviceGroupsService } from './device-groups.service';
import { 
  CreateDeviceGroupDto, 
  UpdateDeviceGroupDto, 
  AddDeviceToGroupDto, 
  RemoveDeviceFromGroupDto,
  GroupCommandDto
} from './dto/device-group.dto';

@ApiTags('Device Groups')
@ApiSecurity('x-api-key')
@Controller('device-groups')
export class DeviceGroupsController {
  private readonly logger = new Logger(DeviceGroupsController.name);

  constructor(private readonly deviceGroupsService: DeviceGroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new device group' })
  @ApiResponse({ status: 201, description: 'The device group has been successfully created.' })
  async create(@Body() createGroupDto: CreateDeviceGroupDto) {
    this.logger.log(`Creating device group: ${createGroupDto.name}`);
    return this.deviceGroupsService.create(createGroupDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all device groups' })
  @ApiResponse({ status: 200, description: 'List of all device groups.' })
  async findAll() {
    return this.deviceGroupsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single device group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiResponse({ status: 200, description: 'The device group.' })
  @ApiResponse({ status: 404, description: 'Device group not found.' })
  async findOne(@Param('id') id: string) {
    return this.deviceGroupsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a device group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiResponse({ status: 200, description: 'The device group has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Device group not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateDeviceGroupDto,
  ) {
    this.logger.log(`Updating device group ${id}`);
    return this.deviceGroupsService.update(id, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a device group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiResponse({ status: 200, description: 'The device group has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Device group not found.' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting device group ${id}`);
    return this.deviceGroupsService.remove(id);
  }

  @Post(':id/devices/add')
  @ApiOperation({ summary: 'Add devices to a group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiBody({ type: AddDeviceToGroupDto })
  @ApiResponse({ status: 200, description: 'Devices added to group successfully.' })
  async addDevicesToGroup(
    @Param('id') id: string,
    @Body() addDeviceDto: AddDeviceToGroupDto,
  ) {
    this.logger.log(`Adding ${addDeviceDto.deviceIds.length} devices to group ${id}`);
    return this.deviceGroupsService.addDevicesToGroup(id, addDeviceDto);
  }

  @Post(':id/devices/remove')
  @ApiOperation({ summary: 'Remove devices from a group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiBody({ type: RemoveDeviceFromGroupDto })
  @ApiResponse({ status: 200, description: 'Devices removed from group successfully.' })
  async removeDevicesFromGroup(
    @Param('id') id: string,
    @Body() removeDeviceDto: RemoveDeviceFromGroupDto,
  ) {
    this.logger.log(`Removing ${removeDeviceDto.deviceIds.length} devices from group ${id}`);
    return this.deviceGroupsService.removeDevicesFromGroup(id, removeDeviceDto);
  }

  @Post(':id/command')
  @ApiOperation({ summary: 'Send command to all devices in a group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiBody({ type: GroupCommandDto })
  @ApiResponse({ status: 200, description: 'Command sent to group devices.' })
  async sendCommandToGroup(
    @Param('id') id: string,
    @Body() commandDto: GroupCommandDto,
  ) {
    this.logger.log(`Sending command ${commandDto.command} to all devices in group ${id}`);
    return this.deviceGroupsService.sendCommandToGroup(id, commandDto);
  }

  @Get(':id/commands')
  @ApiOperation({ summary: 'Get command history for a device group' })
  @ApiParam({ name: 'id', description: 'Device group ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by command type (control/management)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by command status' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date for filtering (ISO string)' })
  @ApiQuery({ name: 'to', required: false, description: 'End date for filtering (ISO string)' })
  @ApiResponse({ status: 200, description: 'Group command history.' })
  async getGroupCommandHistory(
    @Param('id') id: string,
    @Query() query: any,
  ) {
    this.logger.log(`Getting command history for group ${id}`);
    return this.deviceGroupsService.getGroupCommandHistory(id, query);
  }

  @Get('commands/:groupCommandId')
  @ApiOperation({ summary: 'Get details of a specific group command' })
  @ApiParam({ name: 'groupCommandId', description: 'Group command ID' })
  @ApiResponse({ status: 200, description: 'Group command details.' })
  async getGroupCommandDetails(
    @Param('groupCommandId') groupCommandId: string,
  ) {
    this.logger.log(`Getting details for group command ${groupCommandId}`);
    return this.deviceGroupsService.getGroupCommandDetails(groupCommandId);
  }
}
