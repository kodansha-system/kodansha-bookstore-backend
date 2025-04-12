import { IsNotEmpty } from 'class-validator';

export class CreateShopBookDto {
  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  shop_id: string;

  @IsNotEmpty()
  book_id: string;
}
