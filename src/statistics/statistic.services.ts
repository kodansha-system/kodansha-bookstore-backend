import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { OrderStatus } from 'src/utils/enums';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: SoftDeleteModel<OrderDocument>,

    @InjectModel(User.name)
    private readonly customerModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Book.name)
    private readonly bookModel: SoftDeleteModel<BookDocument>,
  ) {}

  async getOverview(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const [
      revenueResult,
      orderCount,
      cancelledCount,
      revenueByDate,
      newCustomerCount,
    ] = await Promise.all([
      this.orderModel.aggregate([
        {
          $match: {
            updatedAt: { $gte: fromDate, $lte: toDate },
            order_status: OrderStatus.Completed,
          },
        },
        { $unwind: '$books' },
        {
          $project: {
            amount: {
              $multiply: [
                { $toDouble: '$books.price' },
                { $toInt: '$books.quantity' },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),

      this.orderModel.countDocuments({
        updatedAt: { $gte: fromDate, $lte: toDate },
      }),

      this.orderModel.countDocuments({
        createdAt: { $gte: fromDate, $lte: toDate },
        order_status: OrderStatus.Cancelled,
      }),

      this.orderModel.aggregate([
        {
          $match: {
            updatedAt: { $gte: fromDate, $lte: toDate },
            order_status: OrderStatus.Completed,
          },
        },
        { $unwind: '$books' },
        {
          $project: {
            amount: {
              $multiply: [
                { $toDouble: '$books.price' },
                { $toInt: '$books.quantity' },
              ],
            },
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' },
            },
          },
        },
        {
          $group: {
            _id: '$date',
            total: { $sum: '$amount' },
          },
        },
        {
          $sort: { _id: 1 },
        },
        {
          $project: {
            ngay: '$_id',
            doanhthu: '$total',
            _id: 0,
          },
        },
      ]),

      this.customerModel.countDocuments({
        updatedAt: { $gte: fromDate, $lte: toDate },
      }),
    ]);

    return {
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
      totalOrders: orderCount,
      cancelledOrders: cancelledCount,
      revenueByDate: revenueByDate || [],
      newCustomerCount,
    };
  }

  async getTopBooks(from?: string, to?: string, categoryId?: string) {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from
      ? new Date(from)
      : new Date(new Date().setMonth(toDate.getMonth() - 6));

    const matchConditions: any = {
      createdAt: { $gte: fromDate, $lte: toDate },
      order_status: OrderStatus.Completed,
    };

    const pipeline: any[] = [
      { $match: matchConditions },
      { $unwind: '$books' },
      {
        $group: {
          _id: '$books.book_id',
          totalSold: { $sum: { $toInt: '$books.quantity' } },
        },
      },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'bookInfo',
        },
      },
      { $unwind: '$bookInfo' },
    ];

    if (categoryId) {
      pipeline.push({
        $match: {
          'bookInfo.category_id': new mongoose.Types.ObjectId(categoryId),
        },
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 1,
          bookName: '$bookInfo.name',
          price: '$bookInfo.price',
          images: '$bookInfo.images',
          rating: '$bookInfo.rating.average',
          totalSold: 1,
        },
      },
      {
        $match: { 'bookInfo.isDeleted': false },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    );

    const topBooks = await this.orderModel.aggregate(pipeline);

    console.log(topBooks);

    if (topBooks.length === 0) {
      const fallbackBooks = await this.bookModel
        .find(categoryId ? { category_id: categoryId } : {}, { name: 1 })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      console.log(fallbackBooks, 'fallbackbook');

      return fallbackBooks.map((book) => ({
        bookName: book.name,
        totalSold: 0,
      }));
    }

    return topBooks;
  }

  async getTopCustomers(from: string, to: string) {
    const fromDate = new Date(from);
    const toDate = new Date(to);

    const topCustomers = await this.orderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate, $lte: toDate },
          order_status: OrderStatus.Completed,
        },
      },
      { $unwind: '$books' },
      {
        $project: {
          user_id: 1,
          amount: {
            $multiply: [
              { $toDouble: '$books.price' },
              { $toInt: '$books.quantity' },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$user_id',
          totalSpent: { $sum: '$amount' },
        },
      },
      {
        $addFields: {
          userObjectId: { $toObjectId: '$_id' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          customerName: '$user.name',
          avatar: '$user.image',
          totalSpent: 1,
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);

    return topCustomers;
  }
}
