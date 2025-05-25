import { Controller, Get, Query } from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';

@ApiTags('addresses')
@Controller('addresses')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Public()
  @Get('/provinces')
  @ResponseMessage('Get all provinces')
  async getProvinces(): Promise<any> {
    return this.provincesService.getProvinces();
  }

  @Public()
  @Get('/districts')
  @ResponseMessage('Get all provinces')
  async getDistricts(@Query() params: any): Promise<any> {
    return this.provincesService.getDistricts(params?.province_id);
  }

  @Public()
  @Get('/wards')
  @ResponseMessage('Get all provinces')
  async getWards(@Query() params: any): Promise<any> {
    return this.provincesService.getWards(params?.district_id);
  }
}
