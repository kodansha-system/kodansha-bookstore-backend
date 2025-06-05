import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import mongoose from 'mongoose';

export class CreateQuestionDto {
  @IsNotEmpty()
  content: string;

  @IsNotEmpty()
  book_id: mongoose.Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  is_verified: boolean;
}
