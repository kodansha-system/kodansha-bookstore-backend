import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ShopDocument = HydratedDocument<Shop>;

@Schema({ timestamps: true })
export class Shop {
  @Prop()
  image: string;

  @Prop()
  phone: string;

  @Prop()
  address: string;

  @Prop()
  ward_id: string;

  @Prop()
  district_id: string;

  @Prop()
  province_id: string;

  @Prop()
  longitude: string;

  @Prop()
  latitude: string;

  @Prop()
  working_time: string;

  @Prop()
  description: string;

  @Prop()
  google_map_url: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deletedBy: mongoose.Schema.Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const ShopSchema = SchemaFactory.createForClass(Shop);
