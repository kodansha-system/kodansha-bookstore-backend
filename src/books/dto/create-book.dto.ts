import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';
import mongoose from 'mongoose';

export class CreateBookDto {
  @IsNotEmpty()
  authors: mongoose.Schema.Types.ObjectId[];

  @IsNotEmpty()
  category_id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  images: Express.Multer.File[];

  @IsNotEmpty()
  total_sold: number;

  @IsNotEmpty()
  company_publish: string;

  @IsNotEmpty()
  width: number;

  @IsNotEmpty()
  length: number;

  @IsNotEmpty()
  height: number;

  @IsNotEmpty()
  weight: number;

  @IsNotEmpty()
  cover_type: string;

  @IsNotEmpty()
  total_pages: number;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  origin_price: number;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}
