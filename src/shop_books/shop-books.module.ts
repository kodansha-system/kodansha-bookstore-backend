import { Module } from '@nestjs/common';
import { ShopBooksService } from './shop-books.service';
import { ShopBooksController } from './shop-books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopBook, ShopBookSchema } from './schemas/shop-book.schema';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShopBook.name, schema: ShopBookSchema },
    ]),
  ],
  controllers: [ShopBooksController],
  providers: [ShopBooksService, FilesService],
  exports: [ShopBooksService],
})
export class ShopBooksModule {}
