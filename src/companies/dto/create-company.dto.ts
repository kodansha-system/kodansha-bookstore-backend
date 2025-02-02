import { IsNotEmpty } from 'class-validator';
export class CreateCompanyDto {
  @IsNotEmpty()
  name: string;

  logo: Express.Multer.File;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  description: string;
}
