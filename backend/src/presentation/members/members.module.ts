import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { CloudinaryModule } from '../../infrastructure/cloudinary/cloudinary.module';
import { MemberService } from '../../application/members/member.service';
import { MembersController } from './members.controller';

@Module({
  imports: [DatabaseModule, CloudinaryModule],
  providers: [MemberService],
  controllers: [MembersController],
})
export class MembersModule {}
