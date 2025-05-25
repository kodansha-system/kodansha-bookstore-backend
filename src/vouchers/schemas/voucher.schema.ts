import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { VoucherType } from 'src/utils/enums';

export type VoucherDocument = HydratedDocument<Voucher>;

@Schema({ timestamps: true })
export class Voucher {
  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: String, required: true })
  start_time: Date;

  @Prop({ type: String, required: true })
  end_time: Date;

  @Prop({ type: Number, required: true })
  discount_percent: number;

  @Prop({ type: Number, required: true })
  max_discount: number;

  @Prop({ type: Number, required: true })
  min_order_total_price: number;

  @Prop({ enum: VoucherType, default: VoucherType.DISCOUNT })
  type: VoucherType;

  @Prop({ type: Number, required: true })
  quantity: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updated_by: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deleted_by: Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const VoucherSchema = SchemaFactory.createForClass(Voucher);
