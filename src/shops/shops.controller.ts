import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UploadedFile,
  Patch,
  UseInterceptors,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { ShopsService } from './shops.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('shops')
@Controller('shops')
export class ShopsController {
  constructor(private readonly shopService: ShopsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createShopDto: CreateShopDto,
    @User() user: IUserBody,
    @UploadedFile() file,
  ) {
    return this.shopService.create(createShopDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách địa chỉ thành công')
  @Get()
  findAll(@Query() query) {
    return this.shopService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateShopDto: UpdateShopDto,
    @User() user: IUserBody,
    @UploadedFile() file,
  ) {
    return this.shopService.update(id, updateShopDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.shopService.remove(id, user);
  }
}
