import {
  IsArray,
  IsEmail,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import mongoose from 'mongoose';
import { AccType } from '../users.interface';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsOptional()
  phone_number: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  @IsOptional()
  @IsString()
  username: string;

  age: number;

  @IsOptional()
  @IsString()
  gender: string;

  @IsArray()
  @IsOptional()
  addresses: {
    customer_name: string;
    phone_number: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    is_default?: boolean;
  }[];
}

export class RegisterUserDto {
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

export class RegisterFacebookUserDto {
  @IsNotEmpty({ message: 'Name không dc để trống' })
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty({ message: 'FacebookId không dc để trống' })
  facebook_id: string;

  type: AccType;
}
