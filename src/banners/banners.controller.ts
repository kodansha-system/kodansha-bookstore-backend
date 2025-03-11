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
import { BannersService } from './banners.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiTags('banners')
@Controller('banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createBannerDto: CreateBannerDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.bannersService.create(createBannerDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách danh mục thành công')
  @Get()
  findAll(@Query() query) {
    return this.bannersService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.bannersService.update(id, updateBannerDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.bannersService.remove(id, user);
  }
}
