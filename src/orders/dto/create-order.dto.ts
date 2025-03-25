import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';

export class BookItemDto {
  @IsNotEmpty()
  @IsMongoId()
  book_id: Types.ObjectId;

  @IsNotEmpty()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  user_id: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  user_address: Types.ObjectId;

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
}
