import { IsNotEmpty } from 'class-validator';
import mongoose, { ObjectId } from 'mongoose';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  description: string;

  is_active: string;

  permissions: [{ type: mongoose.Schema.Types.ObjectId }];
}
