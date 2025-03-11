import { IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateBannerDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  book_id: mongoose.Types.ObjectId;
}
