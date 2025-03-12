import { IsNotEmpty } from 'class-validator';

export class CreateShopAddressDto {
  @IsNotEmpty()
  name: string;

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

  @IsNotEmpty()
  longitude: number;

  @IsNotEmpty()
  latitude: number;
}
