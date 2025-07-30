import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReferenceList, ReferenceListDocument } from './schemas/reference-list.schema';

@Injectable()
export class ReferenceListsService {
  private readonly logger = new Logger(ReferenceListsService.name);

  constructor(
    @InjectModel(ReferenceList.name)
    private referenceListModel: Model<ReferenceListDocument>,
  ) {}

  async upsertReferenceList(data: any): Promise<ReferenceList> {
    const refId =
      data.referenceList?.referenceListId || data.referenceListId;
    if (!refId) {
      throw new BadRequestException('referenceListId is required');
    }
    const payload = {
      referenceListId: refId,
      referenceList: data.referenceList || data,
      results: data.results || [],
    };
    this.logger.log(`Upserting reference list ${refId}`);
    return this.referenceListModel
      .findOneAndUpdate({ referenceListId: refId }, payload, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      })
      .exec();
  }

  async getReferenceLists(filter: any): Promise<ReferenceList[]> {
    return this.referenceListModel.find(filter).exec();
  }
}
