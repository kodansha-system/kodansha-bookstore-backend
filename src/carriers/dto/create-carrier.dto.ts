import { IsNotEmpty } from 'class-validator';

export class CreateCarrierDto {
  @IsNotEmpty()
  name: string;
}
