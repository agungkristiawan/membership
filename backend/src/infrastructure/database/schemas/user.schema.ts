import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<UserSchemaClass>;

@Schema({ collection: 'users', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class UserSchemaClass {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  full_name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ enum: ['male', 'female'] })
  gender?: string;

  @Prop()
  birthdate?: Date;

  @Prop()
  address?: string;

  @Prop({ required: true })
  join_date: Date;

  @Prop({ required: true, enum: ['active', 'inactive', 'pending'], default: 'pending' })
  status: string;

  @Prop({ type: [String], default: [] })
  hobbies: string[];

  @Prop({ maxlength: 500 })
  notes?: string;

  @Prop()
  photo_url?: string;

  @Prop({ required: true, enum: ['admin', 'editor', 'member'], default: 'member' })
  role: string;


  @Prop({ type: String, default: null })
  password_reset_token?: string | null;

  @Prop({ type: Date, default: null })
  password_reset_expires_at?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(UserSchemaClass);

UserSchema.index({ status: 1 });
