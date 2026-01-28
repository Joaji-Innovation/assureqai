/**
 * User Schema
 * Supports multi-tenant with projectId
 */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ROLES, Role } from '@assureqai/common';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(ROLES),
    default: ROLES.AGENT,
  })
  role: Role;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  projectId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  twoFactorSecret?: string;

  @Prop({ default: false })
  twoFactorEnabled: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ projectId: 1 });
UserSchema.index({ role: 1 });
