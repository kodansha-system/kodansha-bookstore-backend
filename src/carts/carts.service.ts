import { Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: SoftDeleteModel<CartDocument>,
  ) {}

  async create(createCartDto: CreateCartDto, user: IUserBody) {
    const cart = await this.cartModel.create({
      ...createCartDto,
      user_id: user?._id,
      created_by: user,
    });

    return {
      cart,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.cartModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.cartModel
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
      carts: result,
    };
  }

  async findOne(id: string) {
    return await this.cartModel.findById(id).populate({
      path: 'books.book_id',
      select: { name: 1, images: 1, price: 1, rating_average: 1 },
    });
  }

  async update(id: string, updateCartDto: UpdateCartDto, user: IUserBody) {
    try {
      return await this.cartModel.updateOne(
        { user_id: user._id },
        { $set: { books: updateCartDto.books } },
        { upsert: true },
      );
    } catch (e) {
      console.log(e);
    }
  }

  remove(id: string, user: IUserBody) {
    return this.cartModel.updateOne(
      { _id: id },
      {
        deleted_by: user,
        isDeleted: true,
      },
    );
  }
}
