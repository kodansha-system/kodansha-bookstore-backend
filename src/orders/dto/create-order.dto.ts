import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ObjectId, Types } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';
import {
  DeliveryMethod,
  PaymentMethod,
  PaymentStatus,
} from '../schemas/order.schema';

export class BookItemDto {
  @IsNotEmpty()
  @IsMongoId()
  book_id: Types.ObjectId;

  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  price: number;

  @IsBoolean()
  is_flash_sale: boolean;
}

class CarrierDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  fee: number;
}

class ParcelDto {
  @IsString()
  width: string;

  @IsString()
  height: string;

  @IsString()
  length: string;

  @IsString()
  weight: string;

  @IsNumber()
  cod: number;

  @IsNumber()
  amount: number;
}

class TrackingDto {
  @IsString()
  time: Date;

  @IsString()
  status: string;
}
export class CreateOrderDto {
  @IsOptional()
  order_code: number;

  user_id: Types.ObjectId;

  @IsOptional()
  shop_id: Types.ObjectId;

  @IsOptional()
  flash_sale_id: Types.ObjectId;

  @ValidateIf((o) => o.delivery_method === DeliveryMethod.HOME_DELIVERY)
  @IsNotEmpty()
  @IsObject()
  delivery_address: {
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

  @IsEnum(DeliveryMethod)
  @IsNotEmpty()
  delivery_method: DeliveryMethod;

  @IsNotEmpty()
  total_price: number;

  @IsNotEmpty()
  discount: number;

  @IsNotEmpty()
  total_to_pay: number;

  @ValidateIf((o) => o.delivery_method === DeliveryMethod.HOME_DELIVERY)
  @ValidateNested()
  @Type(() => CarrierDto)
  carrier: CarrierDto;

  tracking_order: TrackingDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookItemDto)
  books: BookItemDto[];

  @IsOptional()
  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @IsOptional()
  vouchers: ObjectId[];

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @IsOptional()
  payment_link: string;

  @IsOptional()
  note: string;

  @ValidateNested()
  @Type(() => ParcelDto)
  parcel: ParcelDto;
}
