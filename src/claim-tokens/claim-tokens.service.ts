//src/claim-tokens/claim-tokens.service.ts  
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClaimToken, ClaimTokenDocument } from './schemas/claim-token.schema';
@Injectable()
export class ClaimTokensService {
  constructor(@InjectModel(ClaimToken.name) private claimTokenModel: Model<ClaimTokenDocument>) {}

  async claimDevice(token: string, deviceSerial: string): Promise<ClaimToken> {
    const claim = await this.verifyClaimToken(token);
    
    // Ensure claim is a valid Mongoose document before calling save()
    const claimDocument = new this.claimTokenModel(claim);

    // Ensure claim is a valid Mongoose document
    if (!(claimDocument instanceof this.claimTokenModel)) {
      Object.setPrototypeOf(claim, this.claimTokenModel.prototype);
    }
    
    claimDocument.status = 'claimed';
    claimDocument.deviceSerial = deviceSerial;
    claimDocument.claimedAt = new Date();
    return claimDocument.save();
  }

  async generateClaimToken(): Promise<ClaimToken> {
    return this.claimTokenModel.create({});
  }

  async verifyClaimToken(token: string): Promise<ClaimToken> {
    const claim = await this.claimTokenModel.findOne({ token });
    if (!claim) throw new NotFoundException('Claim token not found.');
    if (claim.status !== 'pending') throw new BadRequestException('Claim token is already used or expired.');
    return claim;
  }

}
