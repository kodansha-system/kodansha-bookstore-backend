import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShopDto {
  @IsString()
  phone: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  ward_id: string;

  @IsNotEmpty()
  district_id: string;

  @IsNotEmpty()
  province_id: string;

  @IsOptional()
  name: string;

  @IsOptional()
  longitude: string;

  @IsOptional()
  latitude: string;

  @IsString()
  working_time: string;

  @IsString()
  description: string;

  @IsString()
  google_map_url: string;
}
