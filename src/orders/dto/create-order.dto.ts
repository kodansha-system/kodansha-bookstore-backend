import { Prop } from '@nestjs/mongoose';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ObjectId, Types } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';

export class BookItemDto {
  @IsNotEmpty()
  @IsMongoId()
  book_id: Types.ObjectId;

  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  price: number;
}

class CarrierDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  fee: number;

  @IsString()
  order_code: string;
}

class TrackingDto {
  @IsString()
  time: Date;

  @IsString()
  status: string;
}
export class CreateOrderDto {
  user_id: Types.ObjectId;

  @IsNotEmpty()
  address: {
    name: string;
    phone: string;
    description: string;
  };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookItemDto)
  books: BookItemDto[];

  @IsNotEmpty()
  total_price: number;

  @IsNotEmpty()
  discount: number;

  @IsNotEmpty()
  total_to_pay: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  order_status: OrderStatus;

  @IsOptional()
  vouchers: ObjectId[];

  @ValidateNested()
  @Type(() => CarrierDto)
  carrier: CarrierDto;

  @IsOptional()
  note: string;

  @IsString()
  paymethod: string;

  tracking_order: TrackingDto[];
}
