import { PartialType } from '@nestjs/mapped-types';
import { CreateShopBookDto } from './create-shop-book.dto';

export class UpdateShopBookDto extends PartialType(CreateShopBookDto) {}
