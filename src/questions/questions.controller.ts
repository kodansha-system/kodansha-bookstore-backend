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
import { QuestionsService } from './questions.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createQuestionDto: CreateQuestionDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.questionsService.create(createQuestionDto, user, file);
  }

  @Public()
  @Get()
  findAll(@Query() query) {
    return this.questionsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Patch(':id/verify')
  async verifyQuestion(
    @Param('id') id: string,
    @Body('is_verified') isVerified: boolean,
  ) {
    return this.questionsService.verifiedQuestion(id, isVerified);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @User() user: IUserBody,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.questionsService.update(id, updateQuestionDto, user, file);
  }

  @Post(':id/reply')
  async replyToQuestion(
    @Param('id') id: string,
    @Body('content') content: string,
    @User() staff: IUserBody,
  ) {
    return this.questionsService.replyQuestion(id, content, staff);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUserBody) {
    return this.questionsService.remove(id, user);
  }
}
