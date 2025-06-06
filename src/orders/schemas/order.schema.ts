import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';

export type OrderDocument = HydratedDocument<Order>;

export enum DeliveryMethod {
  STORE_PICKUP = 'store_pickup',
  HOME_DELIVERY = 'home_delivery',
}

export enum PaymentMethod {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
}

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

@Schema({ timestamps: true })
export class Order {
  @Prop()
  order_code: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Object })
  delivery_address: {
    street: string;
    full_address: string;
    ward: string;
    ward_name: string;
    district: string;
    district_name: string;
    city: string;
    province_name: string;
    phone: string;
    customer_name: string;
  };

  @Prop({
    type: String,
    enum: DeliveryMethod,
    required: true,
  })
  delivery_method: DeliveryMethod;

  @Prop({ type: Types.ObjectId, ref: 'Shop' })
  shop_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FlashSale' })
  flash_sale_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  total_price: number;

  @Prop({ type: Number, required: true })
  discount: number;

  @Prop({ type: Number, required: true })
  total_to_pay: number;

  @Prop({ type: Object })
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
      is_flash_sale: { type: Boolean, required: true },
    },
  ])
  books: {
    book_id: Types.ObjectId;
    quantity: number;
    price: number;
    is_flash_sale: boolean;
  }[];

  @Prop({ enum: OrderStatus, default: OrderStatus.New })
  order_status: OrderStatus;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Vouchers' }])
  vouchers: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: String, enum: PaymentMethod, required: true })
  payment_method: PaymentMethod;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  payment_status: PaymentStatus;

  @Prop({ type: String })
  note: string;

  @Prop()
  shop_pickup_expire_at: Date;

  @Prop()
  payment_expire_at: Date;

  @Prop()
  payment_link: string;

  @Prop({ type: Object })
  parcel: {
    cod: number;
    amount: number;
    width: string;
    height: string;
    length: string;
    weight: number;
  };

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
