import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'Name không dc để trống' })
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  @IsNotEmpty({ message: 'Age không dc để trống' })
  age: number;

  @IsNotEmpty({ message: 'Gender không dc để trống' })
  gender: string;

  @IsNotEmpty({ message: 'Address không dc để trống' })
  address: string;

  @IsNotEmpty({ message: 'Role không dc để trống' })
  role: string;

  // @IsNotEmptyObject()
  // @IsObject()
  // @ValidateNested()
  // @Type(() => Company)
  @IsNotEmpty({ message: 'Company không được để trống' })
  company_id: string;
}

export class RegisterUserDto {
  @IsNotEmpty({ message: 'Name không dc để trống' })
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  @IsNotEmpty({ message: 'Age không dc để trống' })
  age: number;

  @IsNotEmpty({ message: 'Gender không dc để trống' })
  gender: string;

  @IsNotEmpty({ message: 'Address không dc để trống' })
  address: string;

  role: string;
}
