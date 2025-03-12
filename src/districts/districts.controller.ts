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
import { DistrictsService } from './districts.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

@ApiTags('districts')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createDistrictDto: CreateDistrictDto,
    @User() user: IUserBody,
  ) {
    return this.districtsService.create(createDistrictDto, user);
  }

  @Public()
  @ResponseMessage('Lấy danh sách tỉnh/thành phố thành công')
  @Get()
  findAll(@Query() query) {
    return this.districtsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.districtsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateDistrictDto: UpdateDistrictDto,
    @User() user: IUserBody,
  ) {
    return this.districtsService.update(id, updateDistrictDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.districtsService.remove(id, user);
  }
}
