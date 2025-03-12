import { Injectable } from '@nestjs/common';
import { CreateProvinceDto } from './dto/create-province.dto';
import { UpdateProvinceDto } from './dto/update-province.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Province, ProvinceDocument } from './schemas/province.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class ProvincesService {
  constructor(
    @InjectModel(Province.name)
    private provinceModel: SoftDeleteModel<ProvinceDocument>,
  ) {}

  async create(createProvinceDto: CreateProvinceDto, user: IUserBody) {
    const province = await this.provinceModel.create({
      ...createProvinceDto,
      createdBy: user._id,
    });

    return {
      province,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.provinceModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.provinceModel
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
      provinces: result,
    };
  }

  async findOne(id: string) {
    return await this.provinceModel.findById(id).populate([
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

  async update(
    id: string,
    updateProvinceDto: UpdateProvinceDto,
    user: IUserBody,
  ) {
    const updateProvince = await this.provinceModel.updateOne(
      { _id: id },
      { ...updateProvinceDto, updatedBy: user._id },
    );

    return updateProvince;
  }

  remove(id: string, user: IUserBody) {
    return this.provinceModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
