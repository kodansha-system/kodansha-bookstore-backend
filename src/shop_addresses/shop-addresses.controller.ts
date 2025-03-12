import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { ShopAddressesService } from './shop-addresses.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateShopAddressDto } from './dto/create-shop-address.dto';
import { UpdateShopAddressDto } from './dto/update-shop-address.dto';

@ApiTags('shop-addresses')
@Controller('shop-addresses')
export class ShopAddressesController {
  constructor(private readonly shopAddressesService: ShopAddressesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createShopAddressDto: CreateShopAddressDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.shopAddressesService.create(createShopAddressDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách cửa hàng thành công')
  @Get()
  findAll(@Query() query) {
    return this.shopAddressesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopAddressesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateShopAddressDto: UpdateShopAddressDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.shopAddressesService.update(
      id,
      updateShopAddressDto,
      user,
      file,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.shopAddressesService.remove(id, user);
  }
}
