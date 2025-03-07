import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';
import { ApiTags } from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('authors')
@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createAuthorDto: CreateAuthorDto,
    @User() user: IUser,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.authorsService.create(createAuthorDto, user, file);
  }

  @Public()
  @ResponseMessage('Lấy danh sách tác giả thành công')
  @Get()
  findAll(@Query() query) {
    return this.authorsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authorsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
    @User() user: IUser,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.authorsService.update(id, updateAuthorDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser) {
    return this.authorsService.remove(id, user);
  }
}
