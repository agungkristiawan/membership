import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import { RefreshTokenSchemaClass, RefreshTokenDocument } from '../schemas/refresh-token.schema';

@Injectable()
export class MongooseRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenSchemaClass.name)
    private readonly model: Model<RefreshTokenDocument>,
  ) {}

  async create(data: {
    token: string;
    user_id: string;
    expires_at: Date;
  }): Promise<RefreshToken> {
    const doc = await this.model.create({ ...data, revoked: false });
    return this.toEntity(doc.toObject());
  }

  async findByToken(tokenHash: string): Promise<RefreshToken | null> {
    const doc = await this.model.findOne({ token: tokenHash }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async revokeByToken(tokenHash: string): Promise<void> {
    await this.model.updateOne({ token: tokenHash }, { $set: { revoked: true } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.model.updateMany({ user_id: userId }, { $set: { revoked: true } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(doc: any): RefreshToken {
    const { _id, __v, ...rest } = doc;
    return { id: String(_id), ...rest } as RefreshToken;
  }
}
