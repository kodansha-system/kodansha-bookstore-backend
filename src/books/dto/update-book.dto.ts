import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBookDto extends PartialType(CreateBookDto) {
  @IsOptional()
  existing_images?: string;
}
