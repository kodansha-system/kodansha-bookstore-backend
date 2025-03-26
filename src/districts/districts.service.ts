import { Injectable } from '@nestjs/common';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { InjectModel } from '@nestjs/mongoose';
import { District, DistrictDocument } from './schemas/district.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class DistrictsService {
  constructor(
    @InjectModel(District.name)
    private districtModel: SoftDeleteModel<DistrictDocument>,
  ) {}

  async create(createDistrictDto: CreateDistrictDto, user: IUserBody) {
    const district = await this.districtModel.create({
      ...createDistrictDto,
      created_by: user._id,
    });

    return {
      district,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.districtModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.districtModel
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
      districts: result,
    };
  }

  async findOne(id: string) {
    return await this.districtModel.findById(id).populate([
      {
        path: 'created_by',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
      {
        path: 'updated_by',
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
    updateDistrictDto: UpdateDistrictDto,
    user: IUserBody,
  ) {
    const updateDistrict = await this.districtModel.updateOne(
      { _id: id },
      { ...updateDistrictDto, updated_by: user._id },
    );

    return updateDistrict;
  }

  remove(id: string, user: IUserBody) {
    return this.districtModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
