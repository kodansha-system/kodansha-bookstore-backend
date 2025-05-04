import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { FilesService } from 'src/files/files.service';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { Book, BookSchema } from 'src/books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, FilesService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
