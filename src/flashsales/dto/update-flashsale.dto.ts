import { PartialType } from '@nestjs/mapped-types';
import { CreateFlashSaleDto } from './create-flashsale.dto';

export class UpdateCartDto extends PartialType(CreateFlashSaleDto) {}
