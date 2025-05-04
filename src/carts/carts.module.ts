import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas/cart.schema';
import { Book, BookSchema } from 'src/books/schemas/book.schema';
import { BooksModule } from 'src/books/books.module';
import {
  FlashSale,
  FlashSaleSchema,
} from 'src/flashsales/schemas/flashsale.schema';
import {
  ShopBook,
  ShopBookSchema,
} from 'src/shop_books/schemas/shop-book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Book.name, schema: BookSchema },
      { name: FlashSale.name, schema: FlashSaleSchema },
      { name: ShopBook.name, schema: ShopBookSchema },
    ]),
    BooksModule,
  ],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
