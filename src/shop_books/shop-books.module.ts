import { Module } from '@nestjs/common';
import { ShopBooksService } from './shop-books.service';
import { ShopBooksController } from './shop-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopBook, ShopBookSchema } from './schemas/shop-book.schema';
import { FilesService } from 'src/files/files.service';
import { ShopsModule } from 'src/shops/shops.module';
import { Shop, ShopSchema } from 'src/shops/schemas/shop.schema';

@Module({
  imports: [
    ShopsModule,
    MongooseModule.forFeature([
      { name: ShopBook.name, schema: ShopBookSchema },
      { name: Shop.name, schema: ShopSchema },
    ]),
  ],
  controllers: [ShopBooksController],
  providers: [ShopBooksService, FilesService],
  exports: [ShopBooksService],
})
export class ShopBooksModule {}
