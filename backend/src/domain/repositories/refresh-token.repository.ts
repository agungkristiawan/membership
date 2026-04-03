import { RefreshToken } from '../entities/refresh-token.entity';

export abstract class RefreshTokenRepository {
  abstract create(data: {
    token: string;
    user_id: string;
    expires_at: Date;
  }): Promise<RefreshToken>;
  abstract findByToken(tokenHash: string): Promise<RefreshToken | null>;
  abstract revokeByToken(tokenHash: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}
