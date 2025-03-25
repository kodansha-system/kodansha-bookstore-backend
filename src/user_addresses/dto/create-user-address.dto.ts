import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserAddressDto {
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  ward: string;

  @IsNotEmpty()
  district: string;

  @IsNotEmpty()
  province: string;

  @IsString()
  customer_name: string;
}
