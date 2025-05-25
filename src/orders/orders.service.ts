import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookItemDto, CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  DeliveryMethod,
  Order,
  OrderDocument,
  PaymentMethod,
  PaymentStatus,
} from './schemas/order.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { OrderStatus } from 'src/utils/enums';
import { ConfigService } from '@nestjs/config';
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
import axios, { AxiosInstance } from 'axios';
import { PayosService } from 'src/payos/payos.service';
import { Voucher, VoucherDocument } from 'src/vouchers/schemas/voucher.schema';
@Injectable()
export class OrdersService {
  private apiShipping: AxiosInstance;

  constructor(
    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,

    @InjectModel(FlashSale.name)
    private flashSaleModel: SoftDeleteModel<FlashSaleDocument>,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    @InjectModel(ShopBook.name)
    private shopBookModel: SoftDeleteModel<ShopBookDocument>,

    @InjectModel(Voucher.name)
    private voucherModel: SoftDeleteModel<VoucherDocument>,

    private configService: ConfigService,

    private readonly payosService: PayosService,
  ) {
    const token = this.configService.get<string>('SHIPPING_API_TOKEN');
    const shippingUrl = this.configService.get<string>('SHIPPING_BASE_URL');

    this.apiShipping = axios.create({
      baseURL: shippingUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });
  }

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
        await this.bookModel.updateOne(
          { _id: new Types.ObjectId(item.book_id) },
          { $inc: { quantity: -item.quantity } },
        );
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

      await this.bookModel.updateOne(
        { _id: new Types.ObjectId(item.book_id) },
        { $inc: { total_sold: item.quantity } },
      );
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
    console.log(createOrderDto?.vouchers, 'check data order');
    const delivery_method = createOrderDto.delivery_method;
    const payment_method = createOrderDto.payment_method;
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

    // ✅ CHECK VOUCHERS
    if (
      Array.isArray(createOrderDto.vouchers) &&
      createOrderDto.vouchers.length > 0
    ) {
      const voucherIds = createOrderDto.vouchers.map(
        (id) => new Types.ObjectId(id.toString()),
      );

      const vouchers = await this.voucherModel.find({
        _id: { $in: voucherIds },
      });

      if (vouchers.length !== voucherIds.length) {
        throw new BadRequestException('Voucher không hợp lệ hoặc đã hết hạn');
      }

      const now = new Date();
      for (const voucher of vouchers) {
        if (voucher.quantity < 1) {
          throw new BadRequestException(
            `Voucher ${voucher.code} đã hết lượt sử dụng.`,
          );
        }
        const endTime = new Date(voucher.end_time);
        const startTime = new Date(voucher.start_time);
        if (voucher.start_time && now < startTime) {
          throw new BadRequestException(
            `Thời gian sử dụng voucher ${voucher.code} chưa bắt đầu.`,
          );
        }

        if (voucher.end_time && now > endTime) {
          throw new BadRequestException(`Voucher ${voucher.code} đã hết hạn.`);
        }
      }
    }

    if (delivery_method === DeliveryMethod.STORE_PICKUP) {
      const shop_pickup_expire_at = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      );

      let paymentResponse;
      const orderCode = Number(`${Date.now()}`.slice(-10));

      if (payment_method === PaymentMethod.ONLINE) {
        paymentResponse = await this.payosService.createPaymentLink({
          orderCode,
          amount: createOrderDto.total_to_pay,
          description: String(orderCode),
          returnUrl: 'http://localhost:3000/my-order',
          cancelUrl: 'http://localhost:3000/my-order',
          expiredAt: Math.floor((Date.now() + 10 * 60 * 1000) / 1000),
        });
      }

      const order = await this.orderModel.create({
        ...createOrderDto,
        order_code: orderCode,
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
        ...(paymentResponse && { payment_link: paymentResponse?.checkoutUrl }),
      });

      // ✅ UPDATE VOUCHER QUANTITY
      const voucherIds = createOrderDto.vouchers.map(
        (id) => new Types.ObjectId(id.toString()),
      );

      console.log('đơn hàng đây');
      console.log(voucherIds, 'voucherIds');
      if (
        Array.isArray(createOrderDto.vouchers) &&
        createOrderDto.vouchers.length > 0
      ) {
        await this.voucherModel.updateMany(
          { _id: { $in: voucherIds } },
          { $inc: { quantity: -1 } },
        );
      }

      await this.updateQuantitiesAfterOrder(
        createOrderDto.books,
        createOrderDto.delivery_method,
        createOrderDto.shop_id,
        createOrderDto.flash_sale_id,
      );

      return { order };
    }

    if (delivery_method === DeliveryMethod.HOME_DELIVERY) {
      let paymentResponse;
      const orderCode = Number(`${Date.now()}`.slice(-10));

      if (payment_method === PaymentMethod.ONLINE) {
        paymentResponse = await this.payosService.createPaymentLink({
          orderCode,
          amount: createOrderDto.total_to_pay,
          description: 'kodansha',
          returnUrl: 'http://localhost:3000/my-order',
          cancelUrl: 'http://localhost:3000/my-order',
          expiredAt: Math.floor((Date.now() + 5 * 60 * 1000) / 1000),
        });
      }

      const order = await this.orderModel.create({
        ...createOrderDto,
        order_code: orderCode,
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
          ...(paymentResponse && {
            payment_link: paymentResponse?.checkoutUrl,
          }),
        }),
      });

      // ✅ UPDATE VOUCHER QUANTITY
      const voucherIds = createOrderDto.vouchers.map(
        (id) => new Types.ObjectId(id.toString()),
      );

      console.log('đơn hàng đây');
      console.log(voucherIds, 'voucherIds');
      if (
        Array.isArray(createOrderDto.vouchers) &&
        createOrderDto.vouchers.length > 0
      ) {
        await this.voucherModel.updateMany(
          { _id: { $in: voucherIds } },
          { $inc: { quantity: -1 } },
        );
      }

      await this.updateQuantitiesAfterOrder(
        createOrderDto.books,
        createOrderDto.delivery_method,
        createOrderDto.shop_id,
        createOrderDto.flash_sale_id,
      );

      return { order };
    }
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
      .sort('-createdAt')
      .populate({
        path: 'user_id',
        select: 'name phone_number email',
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

  private async createGoshipShipment(order: any) {
    try {
      const address = order.delivery_address;

      const res = await this.apiShipping.post('/shipments', {
        shipment: {
          order_id: order._id,
          rate: order.carrier.id,
          address_from: {
            city: '700000',
            district: '700100',
            ward: 8955,
            street: 'Đường Nguyễn Trãi',
            name: 'Kodansha',
            phone: '09342391',
          },
          address_to: {
            city: address?.city,
            district: address?.district,
            ward: address?.ward,
            street: address?.street,
            name: address?.customer_name,
            phone: address?.phone_number,
          },
          parcel: {
            cod: order.total_to_pay,
            amount: order.total_to_pay,
            width: order.parcel.width,
            height: order.parcel.height,
            length: order.parcel.length,
            weight: order.parcel.weight,
          },
        },
      });

      return res;
    } catch (error) {
      console.log('Lỗi khi tạo đơn:', error);

      throw new BadRequestException(
        'Không thể tạo đơn hàng với đối tác vận chuyển ',
      );
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

      if (order.order_status > status) {
        return new BadRequestException('Trạng thái cập nhật không hợp lệ');
      }

      if (!statusExists && order.order_status < status) {
        if (status === OrderStatus.Verified) {
          await this.createGoshipShipment(order);
        }

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

  async cancelOrder(cancelOrderDto, user) {
    const order = await this.orderModel.findById(cancelOrderDto.orderId);

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (order.user_id.toString() !== user._id) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    if (order.order_status === OrderStatus.Cancelled) {
      return { message: 'Đơn hàng đã bị hủy trước đó' };
    }

    if (order.order_status !== OrderStatus.New) {
      throw new ForbiddenException('Hiện không thể hủy đơn hàng.');
    }

    order.order_status = OrderStatus.Cancelled;

    if (cancelOrderDto.note) {
      order.note = cancelOrderDto.note;
    }

    await order.save();

    return { message: 'Đã hủy đơn hàng thành công', order };
  }

  async updatePaymentStatus(orderCode: string, status: string) {
    return this.orderModel.findOneAndUpdate(
      { order_code: orderCode },
      { payment_status: status },
      { new: true },
    );
  }
}
