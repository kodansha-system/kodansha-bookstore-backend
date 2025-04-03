import { PartialType } from '@nestjs/mapped-types';
import { CreatePayMethodDto } from './create-paymethod.dto';

export class UpdatePayMethodDto extends PartialType(CreatePayMethodDto) {}
