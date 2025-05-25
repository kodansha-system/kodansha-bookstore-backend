import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ObjectId } from 'mongoose';
import { VoucherType } from 'src/utils/enums';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  code: string;
  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  start_time: Date;

  @IsDate()
  @Type(() => Date)
  end_time: Date;

  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percent: number;

  @IsNumber()
  @Min(0)
  max_discount: number;

  @IsNumber()
  @Min(0)
  min_order_total_price: number;

  @IsEnum(VoucherType)
  type: VoucherType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  applied_users: ObjectId[];
}
