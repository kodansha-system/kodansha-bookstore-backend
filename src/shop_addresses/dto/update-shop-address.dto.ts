import { PartialType } from '@nestjs/mapped-types';
import { CreateShopAddressDto } from './create-shop-address.dto';

export class UpdateShopAddressDto extends PartialType(CreateShopAddressDto) {}
