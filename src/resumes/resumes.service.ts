import { Injectable } from '@nestjs/common';
import { CreateResumeCVDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Resume, ResumeDocument } from './schemas/Resume.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser, IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
@Injectable()
export class ResumesService {
  constructor(
    @InjectModel(Resume.name)
    private resumeModel: SoftDeleteModel<ResumeDocument>,
  ) {}

  async create(createResumeDto: CreateResumeCVDto, user: IUserBody) {
    const resume = await this.resumeModel.create({
      ...createResumeDto,
      email: user?.email,
      user_id: user?._id,
      status: 'PENDING',
      history: [
        {
          status: 'PENDING',
          updatedAt: new Date(),
          updatedBy: {
            email: user?.email,
            _id: user?._id,
          },
        },
      ],
      createdBy: user,
    });

    return resume;
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.resumeModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.resumeModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection)
      .exec();

    return {
      meta: {
        currentPage: filter?.current || 1,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      resumes: result,
    };
  }

  async findOne(id: string) {
    return await this.resumeModel.findById(id);
  }

  async update(id: string, updateResumeDto: UpdateResumeDto, user: IUserBody) {
    const resume = await this.resumeModel.findById(id);
    const newHistory = resume.history;
    newHistory.push({
      status: updateResumeDto?.status || 'PENDING',
      updatedAt: new Date(),
      updatedBy: {
        _id: user?._id as any,
        email: user?.email,
      },
    });
    const updateResume = await this.resumeModel.updateOne(
      { _id: id },
      { ...updateResumeDto, history: newHistory, updatedBy: user },
    );

    return updateResume;
  }

  remove(id: string, user: IUser) {
    return this.resumeModel.updateOne(
      { _id: id },
      {
        deletedBy: user,
        isDeleted: true,
      },
    );
  }

  async getResumesByUserId(id: string) {
    return await this.resumeModel
      .find({ user_id: id })
      .populate([
        { path: 'job_id', select: { name: 1 } },
        { path: 'company_id', select: { name: 1 } },
      ])
      .sort('-createdAt');
  }
}
