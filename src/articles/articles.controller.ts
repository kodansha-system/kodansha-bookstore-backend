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
import { ArticlesService } from './articles.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createArticleDto: CreateArticleDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.articlesService.create(createArticleDto, user, file);
  }

  @Public()
  @Get()
  findAll(@Query() query) {
    return this.articlesService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.articlesService.update(id, updateArticleDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.articlesService.remove(id, user);
  }
}
