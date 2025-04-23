import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Shop, ShopDocument } from './schemas/shop.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
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
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.shopModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.shopModel
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
