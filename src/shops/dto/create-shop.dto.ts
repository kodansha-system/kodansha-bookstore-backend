import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateShopDto {
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
  name: string;

  @IsString()
  longitude: string;

  @IsString()
  latitude: string;
}
