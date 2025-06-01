import { populate } from 'dotenv';
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
import { Public, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { ShopBooksService } from './shop-books.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateShopBookDto } from './dto/create-shop-book.dto';
import { UpdateShopBookDto } from './dto/update-shop-book.dto';

@ApiTags('shop-books')
@Controller('shop-books')
export class ShopBooksController {
  constructor(private readonly shopBooksService: ShopBooksService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createShopBookDto: CreateShopBookDto,
    @User() user: IUserBody,
  ) {
    return this.shopBooksService.create(createShopBookDto, user);
  }

  @Public()
  @Get()
  findAll(@Query() query) {
    return this.shopBooksService.findAll(query);
  }

  @Public()
  @Get('/book')
  findShopsHaveBook(@Query() query) {
    return this.shopBooksService.findShopsHaveBook(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopBooksService.findOne(id);
  }

  @Patch('/:shop_id')
  updateShopBook(
    @Param('shop_id') shopId: string,
    @Body() updateShopBookDto: UpdateShopBookDto[],
    @User() user: IUserBody,
  ): Promise<any> {
    return this.shopBooksService.updateMany(shopId, updateShopBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.shopBooksService.remove(id, user);
  }

  @Get('/shop/:shop_id')
  getBooksByShopId(@Param('shop_id') shopId: string) {
    return this.shopBooksService.getBooksByShopId(shopId);
  }
}
