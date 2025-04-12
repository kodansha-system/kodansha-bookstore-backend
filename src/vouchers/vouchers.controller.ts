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
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  create(@Body() createVoucherDto: CreateVoucherDto, @User() user: IUserBody) {
    return this.vouchersService.create(createVoucherDto, user);
  }

  @Post('/get-list-voucher-for-order')
  getListVoucherForOrder(@Body() order: any) {
    return this.vouchersService.getListVoucherForOrder(order);
  }

  @Public()
  @ResponseMessage('Lấy danh sách mã giảm giá thành công')
  @Get()
  findAll(@Query() query) {
    return this.vouchersService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
    @User() user: IUserBody,
  ) {
    return this.vouchersService.update(id, updateVoucherDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.vouchersService.remove(id, user);
  }
}
