import { IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateBookDto {
  @IsNotEmpty()
  authors: mongoose.Schema.Types.ObjectId[];

  @IsNotEmpty()
  categories: mongoose.Schema.Types.ObjectId[];

  @IsNotEmpty()
  name: string;

  images: Express.Multer.File[];

  @IsNotEmpty()
  total_sold: number;

  @IsNotEmpty()
  company_publish: string;

  @IsNotEmpty()
  width: number;

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
  discount: number;
}
