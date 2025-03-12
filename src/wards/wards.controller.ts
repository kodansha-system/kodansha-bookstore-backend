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
import { WardsService } from './wards.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';

@ApiTags('wards')
@Controller('wards')
export class WardsController {
  constructor(private readonly wardsService: WardsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createWardDto: CreateWardDto, @User() user: IUserBody) {
    return this.wardsService.create(createWardDto, user);
  }

  @Public()
  @ResponseMessage('Lấy danh sách tỉnh/thành phố thành công')
  @Get()
  findAll(@Query() query) {
    return this.wardsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wardsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateWardDto: UpdateWardDto,
    @User() user: IUserBody,
  ) {
    return this.wardsService.update(id, updateWardDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.wardsService.remove(id, user);
  }
}
