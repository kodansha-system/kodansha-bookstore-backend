import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShopAddressDto } from './dto/create-shop-address.dto';
import { UpdateShopAddressDto } from './dto/update-shop-address.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  ShopAddress,
  ShopAddressDocument,
} from './schemas/shop-address.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class ShopAddressesService {
  constructor(
    @InjectModel(ShopAddress.name)
    private shopAddressModel: SoftDeleteModel<ShopAddressDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createShopAddressDto: CreateShopAddressDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch((e) => {
      console.log(e);
      throw new BadRequestException('Có lỗi xảy ra khi tải file');
    });

    const shopAddress = await this.shopAddressModel.create({
      ...createShopAddressDto,
      image: image.url,
      createdBy: user._id,
    });

    return {
      shopAddress,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.shopAddressModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.shopAddressModel
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
      shopAddresses: result,
    };
  }

  async findOne(id: string) {
    return await this.shopAddressModel.findById(id).populate([
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
    updateShopAddressDto: UpdateShopAddressDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });

      const updateShopAddress = await this.shopAddressModel.updateOne(
        { _id: id },
        { ...updateShopAddressDto, image: image.url, updatedBy: user._id },
      );

      return updateShopAddress;
    }

    const updateShopAddress = await this.shopAddressModel.updateOne(
      { _id: id },
      { ...updateShopAddressDto, updatedBy: user._id },
    );

    return updateShopAddress;
  }

  remove(id: string, user: IUserBody) {
    return this.shopAddressModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
