import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffDto } from './create-staff.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateStaffDto extends PartialType(CreateStaffDto) {}
