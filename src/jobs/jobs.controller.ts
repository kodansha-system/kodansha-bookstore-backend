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
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public, ResponseMessage, User } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @ResponseMessage('Create a new job')
  @Post()
  create(@Body() createJobDto: CreateJobDto, @User() createdBy) {
    return this.jobsService.create(createJobDto, createdBy);
  }

  @Public()
  @Get()
  findAll(@Query() query) {
    return this.jobsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() updatedBy,
  ) {
    return this.jobsService.update(id, updateJobDto, updatedBy);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() deletedBy: IUser) {
    return this.jobsService.remove(id, deletedBy);
  }
}
