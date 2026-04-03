import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RefreshTokenDocument = HydratedDocument<RefreshTokenSchemaClass>;

@Schema({ collection: 'refresh_tokens', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class RefreshTokenSchemaClass {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ default: false })
  revoked: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenSchemaClass);

RefreshTokenSchema.index({ user_id: 1 });
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });
