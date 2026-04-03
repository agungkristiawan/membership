import { Invitation } from '../entities/invitation.entity';

export abstract class InvitationRepository {
  abstract create(data: Partial<Invitation>): Promise<Invitation>;
  abstract findByToken(token: string): Promise<Invitation | null>;
  abstract markUsed(token: string): Promise<void>;
}
