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
import { PayMethodsService } from './paymethods.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePayMethodDto } from './dto/create-paymethod.dto';
import { UpdatePayMethodDto } from './dto/update-paymethod.dto';

@ApiTags('paymethods')
@Controller('paymethods')
export class PayMethodsController {
  constructor(private readonly payMethodsService: PayMethodsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createPayMethodDto: CreatePayMethodDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.payMethodsService.create(createPayMethodDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách phương thức thanh toán thành công')
  @Get()
  findAll(@Query() query) {
    return this.payMethodsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.payMethodsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updatePayMethodDto: UpdatePayMethodDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.payMethodsService.update(id, updatePayMethodDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.payMethodsService.remove(id, user);
  }
}
