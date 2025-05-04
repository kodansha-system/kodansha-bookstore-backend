import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import mongoose from 'mongoose';

export class CreateReviewDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  rating: number;

  @IsNotEmpty()
  book_id: mongoose.Types.ObjectId;

  @IsNotEmpty()
  order_id: mongoose.Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  is_verified: boolean;
}
