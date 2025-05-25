import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Shop, ShopDocument } from './schemas/shop.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import { populate } from 'dotenv';
@Injectable()
export class ShopsService {
  constructor(
    @InjectModel(Shop.name)
    private shopModel: SoftDeleteModel<ShopDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createShopDto: CreateShopDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const shop = await this.shopModel.create({
      ...createShopDto,
      image: image?.url,
      created_by: user._id,
    });

    return {
      shop,
    };
  }

  async findAll(query) {
    const {
      current = 1,
      pageSize = 10,
      keyword,
      get_all,
      ...restQuery
    } = query;

    const isGetAll = get_all === 'true';

    if ('get_all' in restQuery) {
      delete restQuery.get_all;
    }

    const offset = (+current - 1) * +pageSize;
    const defaultLimit = +pageSize || 10;

    const { filter, sort, projection } = aqp(restQuery);

    if (keyword) {
      filter.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
      ];
    }

    const totalItems = await this.shopModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const queryBuilder = this.shopModel
      .find(filter)
      .sort('-createdAt')
      .select(projection);

    if (!isGetAll) {
      queryBuilder.skip(offset).limit(defaultLimit);
    }

    const result = await queryBuilder.exec();

    return {
      meta: {
        currentPage: isGetAll ? 1 : +current,
        pageSize: isGetAll ? totalItems : defaultLimit,
        totalItems,
        totalPages: isGetAll ? 1 : totalPages,
      },
      shops: result,
    };
  }

  async findOne(id: string) {
    return await this.shopModel.findById(id).populate([
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
    updateShopDto: UpdateShopDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const updateShop = await this.shopModel.updateOne(
      { _id: id },
      { ...updateShopDto, image: image?.url, updated_by: user._id },
    );

    return updateShop;
  }

  remove(id: string, user: IUserBody) {
    return this.shopModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
