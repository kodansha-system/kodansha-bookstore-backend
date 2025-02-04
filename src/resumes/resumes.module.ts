import { Module } from '@nestjs/common';
import { ResumesService } from './resumes.service';
import { ResumesController } from './resumes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Resume, ResumeSchema } from './schemas/resume.schema';

@Module({
  controllers: [ResumesController],
  providers: [ResumesService],
  // support access database to crud
  imports: [
    MongooseModule.forFeature([{ name: Resume.name, schema: ResumeSchema }]),
  ],
})
export class ResumesModule {}
