import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './presentation/auth/auth.module';
import { InvitationsModule } from './presentation/invitations/invitations.module';
import { MembersModule } from './presentation/members/members.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    InvitationsModule,
    MembersModule,
  ],
})
export class AppModule {}
