import { FlashSale, FlashSaleSchema } from './schemas/flashsale.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from 'src/books/schemas/book.schema';
import { BooksModule } from 'src/books/books.module';
import { FlashSaleService } from './flashsales.service';
import { FlashSaleController } from './flashsales.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FlashSale.name, schema: FlashSaleSchema },
      { name: Book.name, schema: BookSchema },
    ]),
    BooksModule,
  ],
  controllers: [FlashSaleController],
  providers: [FlashSaleService],
  exports: [FlashSaleService],
})
export class FlashSalesModule {}
