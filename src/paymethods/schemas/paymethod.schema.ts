import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PayMethodDocument = HydratedDocument<PayMethod>;

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updated_at' },
})
export class PayMethod {
  @Prop()
  name: string;

  @Prop()
  code: string;

  @Prop()
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deleted_by: mongoose.Schema.Types.ObjectId;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const PayMethodSchema = SchemaFactory.createForClass(PayMethod);
