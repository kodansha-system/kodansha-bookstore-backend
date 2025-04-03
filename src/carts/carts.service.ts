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
    const {
      books: [newBook],
    } = createCartDto; // Lấy phần tử duy nhất trong books

    // Kiểm tra giỏ hàng của user có tồn tại không
    let cart = await this.cartModel.findOne({ user_id: user._id });

    if (cart) {
      // Tìm quyển sách trong giỏ hàng
      const existingBook = cart.books.find(
        (book) => book.book_id.toString() === newBook.book_id.toString(),
      );

      if (existingBook) {
        // Nếu sách đã tồn tại, cộng dồn quantity
        existingBook.quantity += newBook.quantity;
      } else {
        // Nếu sách chưa có, thêm mới vào giỏ hàng
        cart.books.push(newBook);
      }

      // Lưu cập nhật giỏ hàng
      await cart.save();
    } else {
      // Nếu chưa có giỏ hàng, tạo mới với quyển sách này
      cart = await this.cartModel.create({
        user_id: user._id,
        books: [newBook], // Chỉ có 1 quyển sách
        created_by: user,
      });
    }

    return { cart };
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
      .populate({
        path: 'books.book_id',
        select: {
          name: 1,
          images: 1,
          price: 1,
          rating_average: 1,
          discount: 1,
        },
      })
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
    return await this.cartModel.findOne({ user_id: id }).populate({
      path: 'books.book_id',
      select: { name: 1, images: 1, price: 1, rating_average: 1, discount: 1 },
    });
  }

  async getCartByUserId(user_id: string) {
    const cart = await this.cartModel.findOne({ user_id }).populate({
      path: 'books.book_id',
      select: { name: 1, images: 1, price: 1, rating_average: 1, discount: 1 },
    });
    console.log(cart);
    return cart;
  }

  async update(updateCartDto: UpdateCartDto, user: IUserBody) {
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
