import { IsNotEmpty } from 'class-validator';

export class CreateDistrictDto {
  @IsNotEmpty()
  name: string;
}
