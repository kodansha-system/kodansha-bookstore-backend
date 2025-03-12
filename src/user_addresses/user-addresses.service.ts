import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserAddress,
  UserAddressDocument,
} from './schemas/user-address.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class UserAddressesService {
  constructor(
    @InjectModel(UserAddress.name)
    private userAddressModel: SoftDeleteModel<UserAddressDocument>,

    private fileService: FilesService,
  ) {}

  async create(createUserAddressDto: CreateUserAddressDto, user: IUserBody) {
    const userAddress = await this.userAddressModel.create({
      ...createUserAddressDto,
      createdBy: user._id,
    });

    return {
      userAddress,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.userAddressModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userAddressModel
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
      userAddresses: result,
    };
  }

  async findOne(id: string) {
    return await this.userAddressModel.findById(id).populate([
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
      {
        path: 'province',
        select: 'name',
      },
      {
        path: 'district',
        select: 'name',
      },
      {
        path: 'ward',
        select: 'name',
      },
    ]);
  }

  async update(
    id: string,
    updateUserAddressDto: UpdateUserAddressDto,
    user: IUserBody,
  ) {
    const updateUserAddress = await this.userAddressModel.updateOne(
      { _id: id },
      { ...updateUserAddressDto, updatedBy: user._id },
    );

    return updateUserAddress;
  }

  remove(id: string, user: IUserBody) {
    return this.userAddressModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
