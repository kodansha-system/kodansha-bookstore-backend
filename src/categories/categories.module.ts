import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { FilesService } from 'src/files/files.service';
import { Book, BookSchema } from 'src/books/schemas/book.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Book.name, schema: BookSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService, FilesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
