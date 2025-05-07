import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateFlashSaleDto {
  @IsString()
  name: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleBookDto)
  books: FlashSaleBookDto[];
}

class FlashSaleBookDto {
  @IsMongoId()
  book_id: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(1)
  price: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  sold?: number = 0;
}
