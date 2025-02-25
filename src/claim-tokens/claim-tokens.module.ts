// src/claim-tokens/claim-tokens.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClaimTokensService } from './claim-tokens.service';
import { ClaimTokensController } from './claim-tokens.controller';
import { ClaimToken, ClaimTokenSchema } from './schemas/claim-token.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: ClaimToken.name, schema: ClaimTokenSchema }])],
  controllers: [ClaimTokensController],
  providers: [ClaimTokensService],
  exports: [ClaimTokensService],
})
export class ClaimTokensModule {}
