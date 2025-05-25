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
  UploadedFiles,
} from '@nestjs/common';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUserBody } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { BooksService } from './books.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

@ApiTags('books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  create(
    @Body() createBookDto: CreateBookDto,
    @User() user: IUserBody,
    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    return this.booksService.create(createBookDto, user, files);
  }

  @Public()
  @Get()
  async searchBooks(
    @Query('keyword') keyword: string,
    @Query('categoryId') categoryId: string,
    @Query('authorId') authorId: string,
    @Query('sortPrice') sortPrice: 'asc' | 'desc',
    @Query('ratingGte') ratingGte: string,
    @Query('get_all') isGetAll: boolean,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.booksService.searchBooks(
      keyword,
      categoryId,
      authorId,
      sortPrice,
      ratingGte ? parseFloat(ratingGte) : undefined,
      isGetAll,
      +page ? parseInt(page) : 1,
      +limit ? parseInt(limit) : 10,
    );
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images'))
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
    @User() user: IUserBody,
    @UploadedFiles()
    file: Express.Multer.File[],
  ) {
    return this.booksService.update(id, updateBookDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.booksService.remove(id, user);
  }
}
