import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  Min,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class BookItemDto {
  @IsNotEmpty()
  @IsMongoId()
  book_id: Types.ObjectId;

  @IsNotEmpty()
  @Min(1)
  quantity: number;
}

export class CreateCartDto {
  user_id: Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookItemDto)
  books: BookItemDto[];
}
