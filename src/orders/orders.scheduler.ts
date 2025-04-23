// orders.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OrderStatus } from 'src/utils/enums';
import { Order, PaymentMethod, PaymentStatus } from './schemas/order.schema';
import { OrdersService } from './orders.service';

@Injectable()
export class OrdersScheduler {
  private readonly logger = new Logger(OrdersScheduler.name);

  constructor(
    @InjectModel('Order') private readonly orderModel: Model<Order>,
    private readonly ordersService: OrdersService,
  ) {}

  @Cron('* * * * *', { name: 'checkExpiredOrdersPickupAtShop' })
  async handleExpiredOrders() {
    const now = new Date();

    const expiredPickupOrders = await this.orderModel.find({
      order_status: OrderStatus.New,
      shop_pickup_expire_at: { $lt: now },
    });

    const expiredPaymentOrders = await this.orderModel.find({
      payment_status: PaymentStatus.PENDING,
      payment_expire_at: { $lt: now },
      order_status: OrderStatus.New,
    });

    const updatedOrderIds = new Set();

    for (const order of expiredPickupOrders) {
      const orderId = String(order._id);
      if (!updatedOrderIds.has(orderId)) {
        await this.ordersService.updateOrderStatus(
          orderId,
          OrderStatus.Cancelled,
        );
        await this.orderModel.findByIdAndUpdate(orderId, {
          $set: {
            note: `Đơn hàng bị hủy do quá hạn nhận tại cửa hàng.`,
          },
        });
        updatedOrderIds.add(orderId);
      }
    }

    for (const order of expiredPaymentOrders) {
      const orderId = String(order._id);
      if (!updatedOrderIds.has(orderId)) {
        await this.ordersService.updateOrderStatus(
          orderId,
          OrderStatus.Cancelled,
        );
        await this.orderModel.findByIdAndUpdate(orderId, {
          $set: {
            note: `Đơn hàng bị hủy do quá hạn thanh toán.`,
          },
        });
        updatedOrderIds.add(orderId);
      }
    }

    this.logger.log(`Đã xử lý ${updatedOrderIds.size} đơn hàng hết hạn.`);
  }
}
