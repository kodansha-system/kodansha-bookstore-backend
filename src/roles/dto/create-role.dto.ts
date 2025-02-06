import { IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateRoleDto {
  @IsNotEmpty()
  name: string;

  description: string;

  is_active: string;

  permissions: [{ type: ObjectId }];
}
