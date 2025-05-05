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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @User() user: IUserBody) {
    return this.ordersService.create(createOrderDto, user);
  }

  @Post('/cancel-order')
  cancelOrder(@Body() cancelOrderDto: any, @User() user: IUserBody) {
    return this.ordersService.cancelOrder(cancelOrderDto, user);
  }

  @Public()
  @ResponseMessage('Lấy danh sách đơn hàng thành công')
  @Get()
  findAll(@Query() query) {
    return this.ordersService.findAll(query);
  }

  @Get('/my-order')
  findUserOrder(@Query() query, @User() user: IUserBody) {
    console.log(user?._id);
    return this.ordersService.findUserOrder(user?._id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch('/status/:id')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderDto: { status: number },
    @User() user: IUserBody,
  ) {
    return this.ordersService.updateOrderStatus(id, updateOrderDto.status);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @User() user: IUserBody,
  ) {
    return this.ordersService.update(id, updateOrderDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.ordersService.remove(id, user);
  }
}
