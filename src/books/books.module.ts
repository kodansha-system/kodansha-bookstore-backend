import { Module } from '@nestjs/common';
import { BooksService } from './books.service';
import { BooksController } from './books.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Book, BookSchema } from './schemas/book.schema';
import { FilesService } from 'src/files/files.service';
import { AuthorSchema } from 'src/authors/schemas/author.schema';
import { FlashSaleSchema } from 'src/flashsales/schemas/flashsale.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: 'Author', schema: AuthorSchema },
      { name: 'FlashSale', schema: FlashSaleSchema },
    ]),
  ],
  controllers: [BooksController],
  providers: [BooksService, FilesService],
  exports: [BooksService],
})
export class BooksModule {}
