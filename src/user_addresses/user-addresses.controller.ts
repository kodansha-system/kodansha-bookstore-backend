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
import { UserAddressesService } from './user-addresses.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';

@ApiTags('user-addresses')
@Controller('user-addresses')
export class UserAddressesController {
  constructor(private readonly userAddressesService: UserAddressesService) {}

  @Post()
  create(
    @Body() createUserAddressDto: CreateUserAddressDto,
    @User() user: IUserBody,
  ) {
    return this.userAddressesService.create(createUserAddressDto, user);
  }

  @Public()
  @ResponseMessage('Lấy danh sách địa chỉ thành công')
  @Get()
  findAll(@Query() query) {
    return this.userAddressesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userAddressesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
    @User() user: IUserBody,
  ) {
    return this.userAddressesService.update(id, updateUserAddressDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.userAddressesService.remove(id, user);
  }
}
