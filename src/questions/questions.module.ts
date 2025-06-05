import { Module } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schemas/question.schema';
import { FilesService } from 'src/files/files.service';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { Book, BookSchema } from 'src/books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [QuestionsController],
  providers: [QuestionsService, FilesService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
