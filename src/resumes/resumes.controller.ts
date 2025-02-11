import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { CreateResumeCVDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('resumes')
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  create(@Body() createResumeDto: CreateResumeCVDto, @User() user) {
    return this.resumesService.create(createResumeDto, user);
  }

  @Get()
  findAll(@Query() query) {
    return this.resumesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resumesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResumeDto: UpdateResumeDto,
    @User() user,
  ) {
    return this.resumesService.update(id, updateResumeDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user) {
    return this.resumesService.remove(id, user);
  }

  @Get('/users/:userId')
  async getResumesByUser(@Param('userId') userId: string) {
    return this.resumesService.getResumesByUserId(userId);
  }
}
