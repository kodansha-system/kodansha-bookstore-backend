import { IsNotEmpty } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  api_path: string;

  @IsNotEmpty()
  method: string;

  @IsNotEmpty()
  module: string;
}
