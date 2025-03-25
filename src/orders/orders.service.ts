import { Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { OrderStatus } from 'src/utils/enums';
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: IUserBody) {
    const order = await this.orderModel.create({
      ...createOrderDto,
      user_id: user?._id,
      order_status: OrderStatus.PENDING,
      createdBy: user,
    });

    return {
      order,
    };
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
        path: 'user_address',
        select: 'province district ward address phone customer_name',
      },
    ]);
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
