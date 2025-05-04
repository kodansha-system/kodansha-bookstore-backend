import { BadRequestException, Injectable } from '@nestjs/common';
import { BookItemDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  DeliveryMethod,
  Order,
  OrderDocument,
  PaymentStatus,
} from './schemas/order.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { OrderStatus } from 'src/utils/enums';
import { ConfigService } from '@nestjs/config';
import { PayosService } from 'src/payos/payos.service';
import {
  FlashSale,
  FlashSaleDocument,
} from 'src/flashsales/schemas/flashsale.schema';
import { Types } from 'mongoose';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
import {
  ShopBook,
  ShopBookDocument,
} from 'src/shop_books/schemas/shop-book.schema';
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,

    @InjectModel(FlashSale.name)
    private flashSaleModel: SoftDeleteModel<FlashSaleDocument>,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    @InjectModel(ShopBook.name)
    private shopBookModel: SoftDeleteModel<ShopBookDocument>,

    private configService: ConfigService,

    private readonly payosService: PayosService,
  ) {}

  async handleCheckFlashSaleActive(
    flash_sale_id: any,
    orderBooks: BookItemDto[],
  ) {
    const now = new Date();

    const flashSale = await this.flashSaleModel.findOne({
      _id: new Types.ObjectId(flash_sale_id),
      start_time: { $lte: now },
      end_time: { $gte: now },
    });

    if (!flashSale) {
      throw new BadRequestException(
        'Flash sale không còn hiệu lực hoặc đã hết hạn',
      );
    }

    const flashSaleMap = new Map(
      flashSale.books.map((item: any) => [
        item.book_id.toString(),
        item.quantity,
      ]),
    );

    for (const item of orderBooks) {
      const flashQuantity = flashSaleMap.get(item.book_id);
      if (item.quantity > flashQuantity) {
        throw new BadRequestException(
          `Số lượng đặt mua vượt quá tồn kho flash sale`,
        );
      }
    }
  }

  async updateQuantitiesAfterOrder(
    orderBooks: any[],
    delivery_method: string,
    shop_id?: any,
    flash_sale_id?: any,
  ) {
    for (const item of orderBooks) {
      const isFlashSaleItem = !!flash_sale_id && item.is_flash_sale;
      // Nếu là flash sale → trừ cả trong bảng flashSale
      if (isFlashSaleItem) {
        await this.flashSaleModel.updateOne(
          {
            _id: new Types.ObjectId(flash_sale_id),
            'books.book_id': item.book_id,
          },
          {
            $inc: {
              'books.$.quantity': -item.quantity,
              'books.$.sold': item.quantity,
            },
          },
        );
      }

      // Luôn trừ trong kho thật
      if (delivery_method === DeliveryMethod.HOME_DELIVERY) {
        console.log(item.quantity);
        const modifiedItem = await this.bookModel.updateOne(
          { _id: new Types.ObjectId(item.book_id) },
          { $inc: { quantity: -item.quantity } },
        );

        console.log(modifiedItem, 'modified item');
      }

      if (delivery_method === DeliveryMethod.STORE_PICKUP) {
        if (!shop_id) {
          throw new BadRequestException('Thiếu shop_id khi nhận tại cửa hàng');
        }

        await this.shopBookModel.updateOne(
          {
            book_id: new Types.ObjectId(item.book_id),
            shop_id,
          },
          {
            $inc: { quantity: -item.quantity },
          },
        );
      }
    }
  }

  async checkStockBeforeCreateOrder(
    orderBooks: any[],
    delivery_method: string,
    shop_id?: any,
    flash_sale_id?: any,
  ) {
    for (const item of orderBooks) {
      const { book_id, quantity, is_flash_sale } = item;

      // 1. Nếu là flash sale → check số lượng trong flashSale.books
      if (flash_sale_id && is_flash_sale) {
        const flashSale = await this.flashSaleModel.findOne({
          _id: flash_sale_id,
          'books.book_id': book_id,
        });

        const bookInFlash = flashSale?.books?.find(
          (b) => b.book_id.toString() === book_id.toString(),
        );

        if (!bookInFlash || bookInFlash.quantity < quantity) {
          throw new BadRequestException(
            `Sách trong flash sale đã hết hoặc không đủ số lượng`,
          );
        }
      }

      // 2. Check tồn kho sách chính (nếu nhận tại nhà)
      if (delivery_method === DeliveryMethod.HOME_DELIVERY) {
        const book = await this.bookModel.findById(book_id);
        if (!book || book.get('quantity') < quantity) {
          throw new BadRequestException(
            `Sách ${book?.name || ''} không đủ số lượng trong kho`,
          );
        }
      }

      // 3. Check tồn kho cửa hàng (nếu nhận tại cửa hàng)
      if (delivery_method === DeliveryMethod.STORE_PICKUP) {
        const shopBook = await this.shopBookModel.findOne({
          book_id,
          shop_id,
        });

        if (!shopBook || shopBook.quantity < quantity) {
          throw new BadRequestException(
            `Cửa hàng tạm hết một số sách trong đơn hàng. Vui lòng chọn cửa hàng khác hoặc chọn phương thức giao tại nhà!`,
          );
        }
      }
    }
  }

  async create(createOrderDto: CreateOrderDto, user: IUserBody) {
    const delivery_method = createOrderDto.delivery_method;
    const payment_expire_at = new Date(Date.now() + 5 * 60 * 1000);

    if (createOrderDto?.flash_sale_id) {
      await this.handleCheckFlashSaleActive(
        createOrderDto.flash_sale_id,
        createOrderDto.books,
      );
    }

    await this.checkStockBeforeCreateOrder(
      createOrderDto.books,
      createOrderDto.delivery_method,
      createOrderDto.shop_id,
      createOrderDto.flash_sale_id,
    );

    if (delivery_method === DeliveryMethod.STORE_PICKUP) {
      const shop_pickup_expire_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      const order = await this.orderModel.create({
        ...createOrderDto,
        user_id: user?._id,
        order_status: OrderStatus.New,
        payment_status: PaymentStatus.PENDING,
        tracking_order: [
          {
            status: OrderStatus.New,
            time: new Date(),
          },
        ],
        shop_pickup_expire_at,
        ...(createOrderDto.payment_method === 'online' && {
          payment_expire_at,
        }),
      });

      await this.updateQuantitiesAfterOrder(
        createOrderDto.books,
        createOrderDto.delivery_method,
        createOrderDto.shop_id,
        createOrderDto.flash_sale_id,
      );

      return { order };
    }

    if (delivery_method === DeliveryMethod.HOME_DELIVERY) {
      const order = await this.orderModel.create({
        ...createOrderDto,
        user_id: user?._id,
        order_status: OrderStatus.New,
        payment_status: PaymentStatus.PENDING,
        tracking_order: [
          {
            status: OrderStatus.New,
            time: new Date(),
          },
        ],
        ...(createOrderDto.payment_method === 'online' && {
          payment_expire_at,
        }),
      });

      await this.updateQuantitiesAfterOrder(
        createOrderDto.books,
        createOrderDto.delivery_method,
        createOrderDto.shop_id,
        createOrderDto.flash_sale_id,
      );

      return { order };
    }
    // const paymentLink = await this.payosService.createPaymentLink({
    //   orderCode: Number(`${Date.now()}`.slice(-10)),
    //   amount: 2000,
    //   description: 'kodansha1',
    //   returnUrl: 'http://localhost:3000/payment-result?status=success',
    //   cancelUrl: 'http://localhost:3000/cart',
    //   expiredAt: expirationTime,
    // });

    return 'ok';
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.orderModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.orderModel
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
      orders: result,
    };
  }

  async findOne(id: string) {
    return await this.orderModel.findById(id).populate([
      {
        path: 'books.book_id',
        select: { name: 1, images: 1, price: 1, rating_average: 1 },
      },
      {
        path: 'shop_id',
        select: { address: 1 },
      },
      {
        path: 'user_id',
        select: { name: 1 },
      },
    ]);
  }

  async findUserOrder(userId: string, query) {
    const filter: any = {};

    if (query?.order_status?.length) {
      filter.order_status = { $in: query?.order_status };
    }

    const orders = await this.orderModel
      .find({
        user_id: userId,
        ...filter,
      })
      .sort({ createdAt: -1 })
      .populate([
        {
          path: 'books.book_id',
          select: { name: 1, images: 1, price: 1, rating_average: 1 },
        },
      ]);

    return orders;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, user: IUserBody) {
    try {
      return await this.orderModel.updateOne(
        { user_id: user._id },
        { $set: { books: updateOrderDto.books } },
        { upsert: true },
      );
    } catch (e) {
      console.log(e);
    }
  }

  async updateOrderStatus(id: string, status: number) {
    try {
      const order = await this.orderModel.findById(id);
      if (!order) {
        return new BadRequestException('Không tìm thấy đơn hàng');
      }

      const statusExists = order.tracking_order.some(
        (item) => String(item.status) === String(status),
      );

      if (!statusExists) {
        order.tracking_order.push({
          status,
          time: new Date(),
        });

        order.order_status = status;

        order.markModified('tracking_order');

        await order.save();
      }
    } catch (e) {
      console.log(e);
      throw new BadRequestException('Có lỗi xảy ra khi cập nhật trạng thái');
    }
  }

  remove(id: string, user: IUserBody) {
    return this.orderModel.updateOne(
      { _id: id },
      {
        deleted_by: user,
        isDeleted: true,
      },
    );
  }
}
