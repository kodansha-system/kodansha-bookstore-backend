import { IsNotEmpty } from 'class-validator';

export class CreatePayMethodDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  code: string;
}
