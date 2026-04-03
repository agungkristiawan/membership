import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Invitation } from '../../../domain/entities/invitation.entity';
import { InvitationRepository } from '../../../domain/repositories/invitation.repository';
import { InvitationSchemaClass, InvitationDocument } from '../schemas/invitation.schema';

@Injectable()
export class MongooseInvitationRepository implements InvitationRepository {
  constructor(
    @InjectModel(InvitationSchemaClass.name)
    private readonly model: Model<InvitationDocument>,
  ) {}

  async create(data: Partial<Invitation>): Promise<Invitation> {
    const doc = await this.model.create(data);
    return this.toEntity(doc.toObject());
  }

  async findByToken(token: string): Promise<Invitation | null> {
    const doc = await this.model.findOne({ token }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async markUsed(token: string): Promise<void> {
    await this.model.updateOne({ token }, { $set: { used_at: new Date() } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(doc: any): Invitation {
    const { _id, __v, ...rest } = doc;
    return { id: String(_id), ...rest } as Invitation;
  }
}
