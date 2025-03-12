import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public, User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createUserDto: CreateUserDto,
    @User() user,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.usersService.createNewUser(createUserDto, user, file);
  }

  @Get()
  findAll(@Query() query) {
    return this.usersService.findAll(query);
  }

  @Get(':id/products/:prod')
  findOneProduct(@Param('id') id: string, @Param('prod') idProd: string) {
    // return this.usersService.findOne(+id);
    return {
      id,
      idProd,
    };
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, user, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user) {
    return this.usersService.remove(id, user);
  }
}
