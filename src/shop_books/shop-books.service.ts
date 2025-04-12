import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShopBookDto } from './dto/create-shop-book.dto';
import { UpdateShopBookDto } from './dto/update-shop-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ShopBook, ShopBookDocument } from './schemas/shop-book.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class ShopBooksService {
  constructor(
    @InjectModel(ShopBook.name)
    private shopBookModel: SoftDeleteModel<ShopBookDocument>,
  ) {}

  async create(createShopBookDto: CreateShopBookDto, user: IUserBody) {
    const shopBook = await this.shopBookModel.create({
      ...createShopBookDto,
      created_by: user._id,
    });

    return {
      shopBook,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.shopBookModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.shopBookModel
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
      shopBooks: result,
    };
  }

  async findOne(id: string) {
    return await this.shopBookModel.findById(id).populate([
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
    updateShopBookDto: UpdateShopBookDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      const updateShopBook = await this.shopBookModel.updateOne(
        { _id: id },
        { ...updateShopBookDto, updated_by: user._id },
      );

      return updateShopBook;
    }

    const updateShopBook = await this.shopBookModel.updateOne(
      { _id: id },
      { ...updateShopBookDto, updated_by: user._id },
    );

    return updateShopBook;
  }

  remove(id: string, user: IUserBody) {
    return this.shopBookModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
