import { IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';

export class CreateJobDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  skills: string[];

  @IsNotEmpty()
  company_id: string;

  @IsNotEmpty()
  location: string;

  @IsNotEmpty()
  salary: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  level: string;

  start_date: Date;

  end_date: Date;

  @IsNotEmpty()
  isActive: boolean;

  createdBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  updatedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  createdAt: Date;

  updatedAt: Date;

  isDeleted: boolean;

  deletedAt: Date;
}
