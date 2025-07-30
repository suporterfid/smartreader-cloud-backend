import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ReferenceListsService } from './reference-lists.service';

@Controller('reference-lists')
export class ReferenceListsController {
  constructor(private readonly referenceListsService: ReferenceListsService) {}

  @Post()
  async ingest(@Body() body: any) {
    if (Array.isArray(body)) {
      return Promise.all(
        body.map((b) => this.referenceListsService.upsertReferenceList(b)),
      );
    }
    return this.referenceListsService.upsertReferenceList(body);
  }

  @Post('query')
  async queryLists(@Body() filter: any) {
    return this.referenceListsService.getReferenceLists(filter || {});
  }

  @Get()
  async getLists(@Query() query: any) {
    const filter: any = {};
    for (const key of Object.keys(query)) {
      filter[`referenceList.${key}`] = query[key];
    }
    return this.referenceListsService.getReferenceLists(filter);
  }
}
