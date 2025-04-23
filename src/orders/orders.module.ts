import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { PayosModule } from 'src/payos/payos.module';
import { OrdersScheduler } from './orders.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    PayosModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersScheduler],
  exports: [OrdersService],
})
export class OrdersModule {}
