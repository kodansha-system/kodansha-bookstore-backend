import { IsEmail, IsMongoId, IsNotEmpty } from 'class-validator';
import mongoose from 'mongoose';
import { AccType } from '../users.interface';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateUserDto {
  name: string;

  @IsEmail()
  @IsNotEmpty({ message: 'Email không dc để trống' })
  email: string;

  @IsNotEmpty({ message: 'Password không dc để trống' })
  password: string;

  age: number;

  gender: string;

  address: string;

  @IsNotEmpty({ message: 'Role không dc để trống' })
  @IsMongoId()
  role: mongoose.Schema.Types.ObjectId;

  // @IsNotEmptyObject()
  // @IsObject()
  // @ValidateNested()
  // @Type(() => Company)
  @IsNotEmpty({ message: 'Company không được để trống' })
  @IsMongoId()
  company_id: string;
}

export class RegisterUserDto {
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
