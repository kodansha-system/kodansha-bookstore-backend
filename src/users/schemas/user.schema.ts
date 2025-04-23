import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Role } from 'src/roles/schemas/role.schema';
import { Shop } from 'src/shops/schemas/shop.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  // @Prop({ required: true, unique: true })
  @Prop()
  email: string;

  // @Prop({ required: true })
  @Prop()
  password: string;

  @Prop()
  age: number;

  @Prop()
  gender: string;

  @Prop()
  address: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Shop.name })
  shop_id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Role.name })
  role: mongoose.Schema.Types.ObjectId;

  @Prop()
  refreshToken: string;

  @Prop({ type: Object })
  created_by: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  updated_by: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop()
  facebook_id: string;

  @Prop()
  type: string;

  @Prop()
  image: string;

  @Prop()
  google_id: string;

  @Prop()
  phone_number: string;

  @Prop()
  username: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
