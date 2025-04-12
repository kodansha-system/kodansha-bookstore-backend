import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  create(@Body() createCartDto: CreateCartDto, @User() user: IUserBody) {
    return this.cartsService.create(createCartDto, user);
  }

  @ResponseMessage('Lấy danh sách giỏ hàng thành công')
  @Get()
  findAll(@Query() query) {
    return this.cartsService.findAll(query);
  }

  @Get('/user')
  findOne(@User() user: IUserBody) {
    return this.cartsService.getCartByUserId(user._id);
  }

  @Patch()
  update(@Body() updateCartDto: UpdateCartDto, @User() user: IUserBody) {
    return this.cartsService.update(updateCartDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.cartsService.remove(id, user);
  }
}
