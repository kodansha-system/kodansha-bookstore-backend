import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';
import { AccType } from '../staffs.interface';

export class CreateStaffDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  @IsString()
  @IsOptional()
  username: string;

  age: number;

  @IsString()
  @IsOptional()
  gender: string;

  @IsArray()
  @IsOptional()
  address: string[];
}

export class RegisterStaffDto {
  @IsString()
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  age: number;

  gender: string;

  address: string;

  role: string;

  type: AccType;
}

export class RegisterFacebookStaffDto {
  @IsNotEmpty({ message: 'Name không dc để trống' })
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'FacebookId không dc để trống' })
  facebook_id: string;

  type: AccType;
}
