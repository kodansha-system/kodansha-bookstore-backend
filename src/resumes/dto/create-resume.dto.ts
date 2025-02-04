import { IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateResumeDto {
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  user_id: string;

  @IsNotEmpty()
  url: string;

  @IsNotEmpty()
  company_id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  status: string; // PENDING-REVIEWING-APPROVED-REJECTED

  @IsNotEmpty()
  job_id: mongoose.Schema.Types.ObjectId;
}

export class CreateResumeCVDto {
  @IsNotEmpty()
  url: string;

  @IsNotEmpty()
  company_id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  job_id: mongoose.Schema.Types.ObjectId;
}
