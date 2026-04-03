import { User } from '../entities/user.entity';

export interface FindAllParams {
  page?: number;
  search?: string;
  status?: string;
  perPage?: number;
}

export interface FindAllResult {
  data: User[];
  total: number;
}

export abstract class UserRepository {
  abstract findByUsername(username: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByPasswordResetToken(token: string): Promise<User | null>;
  abstract findById(id: string): Promise<User | null>;
  abstract findAll(params: FindAllParams): Promise<FindAllResult>;
  abstract create(data: Partial<User>): Promise<User>;
  abstract updateById(id: string, data: Partial<User>): Promise<User | null>;
  abstract upsertByUsername(username: string, data: Partial<User>): Promise<User>;
}
