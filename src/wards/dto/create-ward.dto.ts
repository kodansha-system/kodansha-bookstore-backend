import { IsNotEmpty } from 'class-validator';

export class CreateWardDto {
  @IsNotEmpty()
  name: string;
}
