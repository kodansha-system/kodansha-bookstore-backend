import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateShopBookDto } from './dto/create-shop-book.dto';
import { UpdateShopBookDto } from './dto/update-shop-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { ShopBook, ShopBookDocument } from './schemas/shop-book.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';
@Injectable()
export class ShopBooksService {
  constructor(
    @InjectModel(ShopBook.name)
    private shopBookModel: SoftDeleteModel<ShopBookDocument>,
  ) {}

  async create(createShopBookDto: CreateShopBookDto, user: IUserBody) {
    // const isExistShopBook = await this.shopBookModel.find({
    //   book_id: createShopBookDto?.book_id,
    //   shop_id: createShopBookDto?.shop_id,
    // });

    // if (!isExistShopBook) {
    //   const shopBook = await this.shopBookModel.create({
    //     ...createShopBookDto,
    //     created_by: user._id,
    //   });

    //   return {
    //     shopBook,
    //   };
    // }

    return new BadRequestException(
      'Sách đã tồn tại trong cửa hàng này rồi vui lòng cập nhật',
    );
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

  async findShopsHaveBook(query) {
    const bookIds = (query.book_ids || []).map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const results = await this.shopBookModel.aggregate([
      {
        $match: {
          book_id: { $in: bookIds },
          quantity: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: '$shop_id',
          bookIdsInShop: { $addToSet: '$book_id' },
          totalBooks: { $sum: 1 },
        },
      },
      {
        $match: {
          $expr: {
            $eq: [{ $size: '$bookIdsInShop' }, bookIds.length],
          },
        },
      },
      {
        $lookup: {
          from: 'shops',
          localField: '_id',
          foreignField: '_id',
          as: 'shop',
        },
      },
      {
        $unwind: '$shop',
      },
      {
        $match: {
          ...(query?.province_id && {
            'shop.province_id': query.province_id,
          }),
          ...(query?.district_id && {
            'shop.district_id': query.district_id,
          }),
        },
      },
      {
        $project: {
          shop_id: '$_id',
          'shop.name': 1,
          'shop.working_time': 1,
          'shop.address': 1,
          'shop.phone': 1,
          'shop.google_map_url': 1,
        },
      },
    ]);

    return results;
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

  async updateMany(shopId: string, updates: any) {
    const bulkOps = updates?.data?.map((item) => ({
      updateOne: {
        filter: {
          shop_id: shopId,
          book_id: item.book_id,
        },
        update: {
          $set: {
            quantity: item.quantity,
          },
        },
        upsert: true,
      },
    }));

    return this.shopBookModel.bulkWrite(bulkOps);
  }

  async getBooksByShopId(shopId: string) {
    return this.shopBookModel
      .find({ shop_id: shopId })
      .populate({ path: 'book_id', select: 'name' })
      .exec();
  }
}
