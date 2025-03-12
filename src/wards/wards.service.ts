import { Injectable } from '@nestjs/common';
import { CreateWardDto } from './dto/create-ward.dto';
import { UpdateWardDto } from './dto/update-ward.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Ward, WardDocument } from './schemas/ward.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class WardsService {
  constructor(
    @InjectModel(Ward.name)
    private wardModel: SoftDeleteModel<WardDocument>,
  ) {}

  async create(createWardDto: CreateWardDto, user: IUserBody) {
    const ward = await this.wardModel.create({
      ...createWardDto,
      createdBy: user._id,
    });

    return {
      ward,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.wardModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.wardModel
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
      wards: result,
    };
  }

  async findOne(id: string) {
    return await this.wardModel.findById(id).populate([
      {
        path: 'createdBy',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
      {
        path: 'updatedBy',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
    ]);
  }

  async update(id: string, updateWardDto: UpdateWardDto, user: IUserBody) {
    const updateWard = await this.wardModel.updateOne(
      { _id: id },
      { ...updateWardDto, updatedBy: user._id },
    );

    return updateWard;
  }

  remove(id: string, user: IUserBody) {
    return this.wardModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
