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
import { CarriersService } from './carriers.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';

@ApiTags('carriers')
@Controller('carriers')
export class CarriersController {
  constructor(private readonly carriersService: CarriersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createCarrierDto: CreateCarrierDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.carriersService.create(createCarrierDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách đơn vị vận chuyển thành công')
  @Get()
  findAll(@Query() query) {
    return this.carriersService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.carriersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateCarrierDto: UpdateCarrierDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.carriersService.update(id, updateCarrierDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.carriersService.remove(id, user);
  }
}
