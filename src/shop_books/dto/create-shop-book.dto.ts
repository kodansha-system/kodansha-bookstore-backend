import { IsInt, IsMongoId, Min } from 'class-validator';

export class CreateShopBookDto {
  @IsMongoId()
  book_id: string;

  @IsInt()
  @Min(0)
  quantity: number;
}
