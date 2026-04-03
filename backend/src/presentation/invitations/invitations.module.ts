import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { InvitationService } from '../../application/invitations/invitation.service';
import { InvitationsController } from './invitations.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [InvitationService],
  controllers: [InvitationsController],
})
export class InvitationsModule {}
