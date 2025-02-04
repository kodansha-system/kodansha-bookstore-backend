import { IsMongoId, IsNotEmpty } from 'class-validator';
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
  @IsMongoId({ message: 'Id không đúng định dạng' })
  company_id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId({ message: 'Id không đúng định dạng' })
  job_id: mongoose.Schema.Types.ObjectId;
}
