import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository, FindAllParams, FindAllResult } from '../../../domain/repositories/user.repository';
import { UserSchemaClass, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MongooseUserRepository implements UserRepository {
  constructor(
    @InjectModel(UserSchemaClass.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    const doc = await this.model.findOne({ username, status: { $ne: 'inactive' } }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email, status: { $ne: 'inactive' } }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ password_reset_token: token, status: { $ne: 'inactive' } })
      .lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findAll({ page = 1, search, status, perPage = 25 }: FindAllParams): Promise<FindAllResult> {
    const filter: Record<string, unknown> = { status: { $ne: 'inactive' } };

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * perPage;
    const [docs, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(perPage).lean(),
      this.model.countDocuments(filter),
    ]);

    return { data: docs.map((d) => this.toEntity(d)), total };
  }

  async updateById(id: string, data: Partial<User>): Promise<User | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .lean();
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: Partial<User>): Promise<User> {
    const doc = await this.model.create(data);
    return this.toEntity(doc.toObject());
  }

  async upsertByUsername(username: string, data: Partial<User>): Promise<User> {
    const doc = await this.model
      .findOneAndUpdate({ username }, { $set: data }, { upsert: true, new: true })
      .lean();
    return this.toEntity(doc!);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toEntity(doc: any): User {
    const { _id, __v, ...rest } = doc;
    return { id: String(_id), ...rest } as User;
  }
}
