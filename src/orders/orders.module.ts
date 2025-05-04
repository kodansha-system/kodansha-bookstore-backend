import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { PayosModule } from 'src/payos/payos.module';
import { OrdersScheduler } from './orders.scheduler';
import {
  FlashSale,
  FlashSaleSchema,
} from 'src/flashsales/schemas/flashsale.schema';
import { Book, BookSchema } from 'src/books/schemas/book.schema';
import {
  ShopBook,
  ShopBookSchema,
} from 'src/shop_books/schemas/shop-book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: FlashSale.name, schema: FlashSaleSchema },
      { name: Book.name, schema: BookSchema },
      { name: ShopBook.name, schema: ShopBookSchema },
    ]),
    PayosModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersScheduler],
  exports: [OrdersService],
})
export class OrdersModule {}
