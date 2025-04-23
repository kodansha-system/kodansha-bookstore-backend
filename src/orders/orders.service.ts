import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
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
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,

    private configService: ConfigService,

    private readonly payosService: PayosService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: IUserBody) {
    const delivery_method = createOrderDto.delivery_method;
    const payment_expire_at = new Date(Date.now() + 5 * 60 * 1000);

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
