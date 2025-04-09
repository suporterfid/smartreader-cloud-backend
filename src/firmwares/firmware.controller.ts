import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UploadedFile, 
  UseInterceptors,
  Res,
  Logger
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiConsumes, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Response } from 'express';
import { FirmwaresService } from './firmwares.service';
import { MqttService } from '../mqtt/mqtt.service';
import { 
  CreateFirmwareDto, 
  UpdateFirmwareDto, 
  AssignFirmwareDto,
  FirmwareUpgradeCommandDto
} from './dto/firmware.dto';
import { v4 as uuidv4 } from 'uuid';

@ApiTags('Firmware')
@ApiSecurity('x-api-key')
@Controller('firmwares')
export class FirmwaresController {
  private readonly logger = new Logger(FirmwaresController.name);

  constructor(
    private readonly firmwaresService: FirmwaresService,
    private readonly mqttService: MqttService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new firmware entry' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        fileName: {
          type: 'string',
        },
        version: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        compatibleDeviceTypes: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        categories: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createFirmwareDto: CreateFirmwareDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Creating firmware: ${createFirmwareDto.fileName}, version: ${createFirmwareDto.version}`);
    
    // Parse the string arrays properly
    if (typeof createFirmwareDto.compatibleDeviceTypes === 'string') {
      createFirmwareDto.compatibleDeviceTypes = JSON.parse(createFirmwareDto.compatibleDeviceTypes as unknown as string);
    }
    
    if (typeof createFirmwareDto.categories === 'string') {
      createFirmwareDto.categories = JSON.parse(createFirmwareDto.categories as unknown as string);
    }
    
    return this.firmwaresService.create(createFirmwareDto, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all firmware entries' })
  async findAll() {
    return this.firmwaresService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single firmware entry' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  async findOne(@Param('id') id: string) {
    return this.firmwaresService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a firmware entry' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateFirmwareDto: UpdateFirmwareDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.logger.log(`Updating firmware ${id}`);
    
    // Parse the string arrays properly if they are strings
    if (typeof updateFirmwareDto.compatibleDeviceTypes === 'string') {
      updateFirmwareDto.compatibleDeviceTypes = JSON.parse(updateFirmwareDto.compatibleDeviceTypes as unknown as string);
    }
    
    if (typeof updateFirmwareDto.categories === 'string') {
      updateFirmwareDto.categories = JSON.parse(updateFirmwareDto.categories as unknown as string);
    }
    
    return this.firmwaresService.update(id, updateFirmwareDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a firmware entry' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  async remove(@Param('id') id: string) {
    return this.firmwaresService.remove(id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign firmware to devices' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  async assignToDevices(
    @Param('id') id: string,
    @Body() assignDto: AssignFirmwareDto,
  ) {
    return this.firmwaresService.assignToDevices(id, assignDto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download firmware file' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  async downloadFirmware(@Param('id') id: string, @Res() res: Response) {
    const file = await this.firmwaresService.getFirmwareFile(id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.fileName}"`,
    });
    res.send(file.buffer);
  }

  @Post(':id/upgrade')
  @ApiOperation({ summary: 'Send firmware upgrade command to devices' })
  @ApiParam({ name: 'id', description: 'Firmware ID' })
  async upgradeFirmware(
    @Param('id') id: string,
    @Body() deviceIds: string[],
    @Body() upgradeOptions?: Partial<FirmwareUpgradeCommandDto>,
  ) {
    const firmware = await this.firmwaresService.findOne(id);
    
    // Generate the server URL (in a real application, this would be configurable)
    const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
    const firmwareUrl = `${serverUrl}/firmwares/${id}/download`;
    
    const results = [];
    
    for (const deviceId of deviceIds) {
      try {
        // Create an upgrade command payload
        const commandPayload = {
          command: 'upgrade',
          command_id: uuidv4(),
          payload: {
            url: firmwareUrl,
            timeoutInMinutes: upgradeOptions?.timeoutInMinutes || 4,
            maxRetries: upgradeOptions?.maxRetries || 3,
            version: firmware.version
          }
        };
        
        // Send the command to the device
        this.mqttService.publishControlCommand(deviceId, commandPayload);
        
        results.push({
          deviceId,
          status: 'command_sent',
          message: `Upgrade command sent to device ${deviceId}`
        });
        
        this.logger.log(`Sent firmware upgrade command to device ${deviceId} for firmware ${id} (${firmware.version})`);
      } catch (error) {
        this.logger.error(`Error sending firmware upgrade command to device ${deviceId}: ${error.message}`, error.stack);
        
        results.push({
          deviceId,
          status: 'error',
          message: `Failed to send upgrade command: ${error.message}`
        });
      }
    }
    
    return {
      firmwareId: id,
      firmwareVersion: firmware.version,
      results
    };
  }
}