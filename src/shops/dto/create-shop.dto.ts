import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateShopDto {
  @IsNotEmpty()
  phone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  ward_id: string;

  @IsNotEmpty()
  district_id: string;

  @IsNotEmpty()
  province_id: string;

  @IsString()
  name: string;

  @IsString()
  longitude: string;

  @IsString()
  latitude: string;

  @IsString()
  working_time: string;

  @IsString()
  description: string;

  @IsString()
  google_map_url: string;
}
