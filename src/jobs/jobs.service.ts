import { Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(Job.name)
    private jobModel: SoftDeleteModel<JobDocument>,
  ) {}

  async create(createJobDto: CreateJobDto, created_by: IUser) {
    const job = await this.jobModel.create({ ...createJobDto, created_by });
    return job;
  }

  async findAll(query) {
    const { filter, sort, population } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.jobModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.jobModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .exec();

    return {
      meta: {
        currentPage: filter?.current || 1,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      jobs: result,
    };
  }

  async findOne(id: string) {
    const job = await this.jobModel.findById({ _id: id });
    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto, updated_by: IUser) {
    const job = await this.jobModel.updateOne(
      { _id: id },
      { ...updateJobDto, updated_by },
    );
    return job;
  }

  async remove(id: string, deletedBy: IUser) {
    await this.jobModel.updateOne({ _id: id }, { deletedBy });

    const deletedJob = await this.jobModel.softDelete({ _id: id });

    return deletedJob;
  }
}
