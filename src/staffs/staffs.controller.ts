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
import { StaffsService } from './staffs.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Public, User } from 'src/decorator/customize';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('staffs')
@Controller('staffs')
export class StaffsController {
  constructor(private readonly staffsService: StaffsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createStaffDto: CreateStaffDto,
    @User() staff,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.staffsService.createNewStaff(createStaffDto, staff, file);
  }

  @Get()
  findAll(@Query() query) {
    return this.staffsService.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.staffsService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @User() staff,
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return this.staffsService.update(id, updateStaffDto, staff, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() staff) {
    return this.staffsService.remove(id, staff);
  }
}
