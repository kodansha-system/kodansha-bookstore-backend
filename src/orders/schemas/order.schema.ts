import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';

export type OrderDocument = HydratedDocument<Order>;
@Schema({ _id: false })
export class Carrier {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  fee: number;

  @Prop({ required: true })
  order_code: string;
}
export const CarrierSchema = SchemaFactory.createForClass(Carrier);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Object })
  address: {
    street: string;
    ward_id: string;
    ward_name: string;
    district_id: string;
    district_name: string;
    province_id: string;
    province_name: string;
    phone: string;
    customer_name: string;
  };

  @Prop({ type: Number, required: true })
  total_price: number;

  @Prop({ type: Number, required: true })
  discount: number;

  @Prop({ type: Number, required: true })
  total_to_pay: number;

  @Prop({ type: Object, required: true })
  carrier: {
    id: string;
    name: string;
    fee: number;
  };

  @Prop({ type: Object, required: true })
  tracking_order: {
    status: number;
    time: Date;
  }[];

  @Prop([
    {
      book_id: { type: Types.ObjectId, ref: 'Book', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true },
    },
  ])
  books: { book_id: Types.ObjectId; quantity: number; price: number }[];

  @Prop({ enum: OrderStatus, default: OrderStatus.New })
  order_status: OrderStatus;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Vouchers' }])
  vouchers: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: String })
  paymethod: string;

  @Prop({ type: String })
  note: string;

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
  deleted_by: {
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
}

export const OrderSchema = SchemaFactory.createForClass(Order);
