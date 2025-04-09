import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { FirmwareCategoriesService } from './firmware-categories.service';
import { CreateFirmwareCategoryDto, UpdateFirmwareCategoryDto } from './dto/firmware-category.dto';

@ApiTags('Firmware Categories')
@ApiSecurity('x-api-key')
@Controller('firmware-categories')
export class FirmwareCategoriesController {
  private readonly logger = new Logger(FirmwareCategoriesController.name);

  constructor(private readonly categoriesService: FirmwareCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new firmware category' })
  @ApiResponse({ status: 201, description: 'The category has been successfully created.' })
  async create(@Body() createCategoryDto: CreateFirmwareCategoryDto) {
    this.logger.log(`Creating firmware category: ${createCategoryDto.name}`);
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all firmware categories' })
  @ApiResponse({ status: 200, description: 'List of all firmware categories.' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single firmware category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'The firmware category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a firmware category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'The category has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateFirmwareCategoryDto,
  ) {
    this.logger.log(`Updating firmware category ${id}`);
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a firmware category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'The category has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async remove(@Param('id') id: string) {
    this.logger.log(`Deleting firmware category ${id}`);
    return this.categoriesService.remove(id);
  }

  @Get(':id/firmware')
  @ApiOperation({ summary: 'Get all firmware in a category' })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'List of firmware in the category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  async getFirmwareByCategory(@Param('id') id: string) {
    return this.categoriesService.getFirmwareByCategory(id);
  }
}
