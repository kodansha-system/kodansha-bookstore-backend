import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createBookDto: CreateBookDto,
    user: IUserBody,
    files: Express.Multer.File[],
  ) {
    console.log(createBookDto, 'check create');

    if (!files || files.length === 0) {
      throw new BadRequestException('No images uploaded.');
    }

    const uploadedImages = await Promise.all(
      files.map(async (file) => {
        this.fileService.validateFile(file);
        return this.fileService.uploadImage(file);
      }),
    ).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const book = await this.bookModel.create({
      ...createBookDto,
      images: uploadedImages.map((img) => img.url),
      createdBy: user._id,
    });

    return {
      book,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.bookModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.bookModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection)
      .exec();

    return {
      meta: {
        currentPage: filter?.current || 1,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      books: result,
    };
  }

  async findOne(id: string) {
    return await this.bookModel.findById(id).populate([
      {
        path: 'createdBy',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
      {
        path: 'updatedBy',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
      {
        path: 'authors',
        select: 'name',
      },
      {
        path: 'categories',
        select: 'name',
      },
    ]);
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    user: IUserBody,
    files?: Express.Multer.File[],
  ) {
    console.log(updateBookDto, 'check');

    if (files) {
      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          this.fileService.validateFile(file);
          return this.fileService.uploadImage(file);
        }),
      ).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const books = await this.bookModel.create({
        ...updateBookDto,
        images: uploadedImages.map((img) => img.url),
        updatedBy: user._id,
      });

      return books;
    }

    const updateBook = await this.bookModel.updateOne(
      { _id: id },
      { ...updateBookDto, updatedBy: user._id },
    );

    return updateBook;
  }

  remove(id: string, user: IUserBody) {
    return this.bookModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
