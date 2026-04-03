import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchemaClass, UserSchema } from './schemas/user.schema';
import { RefreshTokenSchemaClass, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { InvitationSchemaClass, InvitationSchema } from './schemas/invitation.schema';
import { MongooseUserRepository } from './repositories/mongoose-user.repository';
import { MongooseRefreshTokenRepository } from './repositories/mongoose-refresh-token.repository';
import { MongooseInvitationRepository } from './repositories/mongoose-invitation.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { InvitationRepository } from '../../domain/repositories/invitation.repository';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: UserSchemaClass.name, schema: UserSchema },
      { name: RefreshTokenSchemaClass.name, schema: RefreshTokenSchema },
      { name: InvitationSchemaClass.name, schema: InvitationSchema },
    ]),
  ],
  providers: [
    { provide: UserRepository, useClass: MongooseUserRepository },
    { provide: RefreshTokenRepository, useClass: MongooseRefreshTokenRepository },
    { provide: InvitationRepository, useClass: MongooseInvitationRepository },
  ],
  exports: [UserRepository, RefreshTokenRepository, InvitationRepository],
})
export class DatabaseModule {}
