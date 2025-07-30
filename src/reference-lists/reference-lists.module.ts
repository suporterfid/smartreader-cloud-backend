import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferenceListsService } from './reference-lists.service';
import { ReferenceListsController } from './reference-lists.controller';
import { ReferenceList, ReferenceListSchema } from './schemas/reference-list.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ReferenceList.name, schema: ReferenceListSchema }])],
  controllers: [ReferenceListsController],
  providers: [ReferenceListsService],
  exports: [ReferenceListsService],
})
export class ReferenceListsModule {}
