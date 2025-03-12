import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';

@ApiTags('provinces')
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createProvinceDto: CreateProvinceDto,
    @User() user: IUserBody,
  ) {
    return this.provincesService.create(createProvinceDto, user);
  }

  @Public()
  @ResponseMessage('Lấy danh sách tỉnh/thành phố thành công')
  @Get()
  findAll(@Query() query) {
    return this.provincesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.provincesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProvinceDto: UpdateProvinceDto,
    @User() user: IUserBody,
  ) {
    return this.provincesService.update(id, updateProvinceDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.provincesService.remove(id, user);
  }
}
