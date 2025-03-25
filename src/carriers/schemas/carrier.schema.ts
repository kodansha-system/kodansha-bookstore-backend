import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type CarrierDocument = HydratedDocument<Carrier>;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updated_at' },
})
export class Carrier {
  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updatedBy: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deleted_by: mongoose.Schema.Types.ObjectId;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const CarrierSchema = SchemaFactory.createForClass(Carrier);
