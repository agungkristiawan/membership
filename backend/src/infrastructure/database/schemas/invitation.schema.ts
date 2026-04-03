import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InvitationDocument = HydratedDocument<InvitationSchemaClass>;

@Schema({ collection: 'invitations', timestamps: { createdAt: 'created_at', updatedAt: false } })
export class InvitationSchemaClass {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true })
  invited_by: string;

  @Prop({ required: true })
  expires_at: Date;

  @Prop({ type: Date, default: null })
  used_at?: Date | null;
}

export const InvitationSchema = SchemaFactory.createForClass(InvitationSchemaClass);

InvitationSchema.index({ token: 1 }, { unique: true });
InvitationSchema.index({ expires_at: 1 });
