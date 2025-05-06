import { Injectable } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
import {
  FlashSale,
  FlashSaleDocument,
} from 'src/flashsales/schemas/flashsale.schema';
import { Types } from 'mongoose';
import {
  ShopBook,
  ShopBookDocument,
} from 'src/shop_books/schemas/shop-book.schema';
@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: SoftDeleteModel<CartDocument>,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    @InjectModel(FlashSale.name)
    private flashSaleModel: SoftDeleteModel<FlashSaleDocument>,

    @InjectModel(ShopBook.name)
    private shopBookModel: SoftDeleteModel<ShopBookDocument>,
  ) {}

  async create(createCartDto: CreateCartDto, user: IUserBody) {
    const {
      books: [newBook],
    } = createCartDto;

    const bookInStock: any = await this.bookModel
      .findById(newBook.book_id)
      .lean();

    if (!bookInStock) {
      throw new Error('Sách không tồn tại.');
    }

    const bookId = new Types.ObjectId(newBook.book_id);

    const shopStock = await this.shopBookModel.aggregate([
      { $match: { book_id: bookId } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    const totalShopQuantity = shopStock[0]?.totalQuantity || 0;
    const totalAvailable = (bookInStock.quantity || 0) + totalShopQuantity;

    if (totalAvailable < newBook.quantity) {
      throw new Error('Số lượng sách không đủ.');
    }

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
    const cart = await this.cartModel.findOne({ user_id: id }).populate({
      path: 'books.book_id',
      select: { name: 1, images: 1, price: 1, rating_average: 1, discount: 1 },
    });
  }

  async getCartByUserId(user_id: string) {
    const cartDoc = await this.cartModel
      .findOne({ user_id: user_id })
      .populate({
        path: 'books.book_id',
        select: {
          name: 1,
          images: 1,
          price: 1,
          rating_average: 1,
          discount: 1,
          width: 1,
          height: 1,
          length: 1,
          weight: 1,
        },
      });

    if (!cartDoc) return null;

    const cart = cartDoc.toObject();

    const now = new Date();

    const flashSale = await this.flashSaleModel
      .findOne({
        start_time: { $lte: now },
        end_time: { $gte: now },
      })
      .populate('books.book_id');

    if (flashSale) {
      const flashSaleMap = new Map(
        flashSale.books.map((item: any) => [item.book_id._id.toString(), item]), // Map book_id -> flash sale item
      );

      cart.books = cart.books.map((item: any) => {
        const bookId = item.book_id._id.toString();
        const flashSaleItem = flashSaleMap.get(bookId);

        const book = {
          ...item.book_id,
          price: flashSaleItem?.price || item.book_id.price,
          is_flash_sale: !!flashSaleItem,
        };

        return {
          ...item,
          book_id: book,
        };
      });
    }

    if (!flashSale) {
      return cart;
    }

    return {
      ...cart,
      flash_sale_id: flashSale?._id,
    };
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
