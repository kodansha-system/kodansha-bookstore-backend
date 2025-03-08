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
import { CategoriesService } from './categories.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.categoriesService.create(createCategoryDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách danh mục thành công')
  @Get()
  findAll(@Query() query) {
    return this.categoriesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.categoriesService.update(id, updateCategoryDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.categoriesService.remove(id, user);
  }
}
