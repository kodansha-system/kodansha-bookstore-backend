import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { StatisticsController } from './statistic.controller';
import { StatisticsService } from './statistic.services';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { Book, BookSchema } from 'src/books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
