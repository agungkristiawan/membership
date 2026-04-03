import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { MemberService } from '../../application/members/member.service';
import { MembersController } from './members.controller';

@Module({
  imports: [DatabaseModule],
  providers: [MemberService],
  controllers: [MembersController],
})
export class MembersModule {}
