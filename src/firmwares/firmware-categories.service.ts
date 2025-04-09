import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FirmwareCategory, FirmwareCategoryDocument } from './schemas/firmware-category.schema';
import { Firmware, FirmwareDocument } from './schemas/firmware.schema';
import { CreateFirmwareCategoryDto, UpdateFirmwareCategoryDto } from './dto/firmware-category.dto';

@Injectable()
export class FirmwareCategoriesService {
  private readonly logger = new Logger(FirmwareCategoriesService.name);

  constructor(
    @InjectModel(FirmwareCategory.name) private categoryModel: Model<FirmwareCategoryDocument>,
    @InjectModel(Firmware.name) private firmwareModel: Model<FirmwareDocument>,
  ) {}

  async create(createCategoryDto: CreateFirmwareCategoryDto): Promise<FirmwareCategory> {
    try {
      // Check if a category with the same name already exists
      const existingCategory = await this.categoryModel.findOne({ name: createCategoryDto.name }).exec();
      if (existingCategory) {
        throw new BadRequestException(`Category with name '${createCategoryDto.name}' already exists`);
      }
      
      const category = new this.categoryModel(createCategoryDto);
      const savedCategory = await category.save();
      this.logger.log(`Created firmware category: ${savedCategory._id}`);
      return savedCategory;
    } catch (error) {
      this.logger.error(`Error creating firmware category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<FirmwareCategory[]> {
    return this.categoryModel.find().exec();
  }

  async findOne(id: string): Promise<FirmwareCategory> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException(`Firmware category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateFirmwareCategoryDto): Promise<FirmwareCategory> {
    try {
      // Check if the category exists
      const category = await this.categoryModel.findById(id).exec();
      if (!category) {
        throw new NotFoundException(`Firmware category with ID ${id} not found`);
      }
      
      // If updating the name, check if the new name already exists
      if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
        const existingCategory = await this.categoryModel.findOne({ name: updateCategoryDto.name }).exec();
        if (existingCategory && existingCategory._id.toString() !== id) {
          throw new BadRequestException(`Category with name '${updateCategoryDto.name}' already exists`);
        }
      }
      
      // Update the category
      const updatedCategory = await this.categoryModel.findByIdAndUpdate(
        id,
        updateCategoryDto,
        { new: true }
      ).exec();
      
      this.logger.log(`Updated firmware category: ${id}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Error updating firmware category: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string): Promise<FirmwareCategory> {
    // Check if any firmware is using this category
    const firmwareCount = await this.firmwareModel.countDocuments({ categories: id }).exec();
    if (firmwareCount > 0) {
      throw new BadRequestException(`Cannot delete category: ${firmwareCount} firmware records are using this category`);
    }
    
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) {
      throw new NotFoundException(`Firmware category with ID ${id} not found`);
    }
    
    this.logger.log(`Deleted firmware category: ${id}`);
    return category;
  }

  async getFirmwareByCategory(categoryId: string): Promise<Firmware[]> {
    const category = await this.categoryModel.findById(categoryId).exec();
    if (!category) {
      throw new NotFoundException(`Firmware category with ID ${categoryId} not found`);
    }
    
    const firmware = await this.firmwareModel.find({ categories: categoryId }).exec();
    return firmware;
  }
}
