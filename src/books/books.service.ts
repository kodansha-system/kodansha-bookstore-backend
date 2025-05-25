import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Book, BookDocument } from './schemas/book.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import mongoose, { Types } from 'mongoose';
import {
  FlashSale,
  FlashSaleDocument,
} from 'src/flashsales/schemas/flashsale.schema';
@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    @InjectModel('Author')
    private authorModel: SoftDeleteModel<any>,

    @InjectModel(FlashSale.name)
    private flashSaleModel: SoftDeleteModel<FlashSaleDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createBookDto: CreateBookDto,
    user: IUserBody,
    files: Express.Multer.File[],
  ) {
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
      created_by: user._id,
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

    if (filter.category_id)
      filter.category_id = new mongoose.Types.ObjectId(filter?.category_id);

    const totalItems = (await this.bookModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    if (filter.get_all === true) {
      return { books: await this.bookModel.find({}).exec() };
    }

    const result = await this.bookModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate([
        {
          path: 'authors',
          select: 'name',
        },
      ])
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
        path: 'created_by',
        select: '_id name role',
        populate: {
          path: 'role',
          select: 'name',
        },
      },
      {
        path: 'updated_by',
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
        path: 'category_id',
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
    let uploadedImages: { url: string }[] = [];

    if (files?.length) {
      uploadedImages = await Promise.all(
        files.map(async (file) => {
          this.fileService.validateFile(file);
          const result = await this.fileService.uploadImage(file);
          if (!result || typeof result.url !== 'string') {
            throw new BadRequestException('Image upload failed.');
          }
          return { url: result.url };
        }),
      ).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });
    }

    let existingImages = [];

    if (typeof updateBookDto.existing_images === 'string') {
      existingImages = JSON.parse(updateBookDto.existing_images);
    }

    const finalImages = [
      ...existingImages,
      ...uploadedImages.map((img) => img.url),
    ];

    const updateData: any = {
      ...updateBookDto,
      images: finalImages,
      updated_by: user._id,
    };

    delete updateData.existing_images;

    return this.bookModel.updateOne({ _id: id }, updateData);
  }

  remove(id: string, user: IUserBody) {
    return this.bookModel.updateOne(
      { _id: id },
      {
        deleted_by: user._id,
        isDeleted: true,
      },
    );
  }

  async searchBooks(
    keyword?: string,
    categoryId?: string | string[],
    authorId?: string | string[],
    sortPrice?: 'asc' | 'desc',
    ratingGte?: number,
    isGetAll?: boolean,
    page = 1,
    limit = 10,
  ) {
    if (isGetAll) {
      return await this.bookModel
        .find({
          $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
        })
        .exec();
    }

    const pipeline: any[] = [];

    pipeline.push({
      $match: {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
    });

    const matchStage: any = {};

    if (categoryId) {
      let categoryIds: string[];
      if (typeof categoryId === 'string') {
        categoryIds = categoryId.split(',').map((id) => id.trim());
      } else {
        categoryIds = categoryId;
      }

      matchStage.category_id = {
        $in: categoryIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (ratingGte !== undefined) {
      matchStage.rating_average = { $gte: ratingGte };
    }

    if (authorId) {
      let authorIds: string[];
      if (typeof authorId === 'string') {
        authorIds = authorId.split(',').map((id) => id.trim());
      } else {
        authorIds = authorId;
      }

      matchStage.authors = {
        $in: authorIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push({
      $lookup: {
        from: 'authors',
        localField: 'authors',
        foreignField: '_id',
        as: 'authorDetails',
      },
    });

    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category_id',
        foreignField: '_id',
        as: 'category',
      },
    });

    pipeline.push({
      $unwind: '$category',
    });

    if (keyword) {
      const searchPattern = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

      pipeline.push({
        $match: {
          name: {
            $regex: searchPattern,
            $options: 'i',
          },
        },
      });
    }

    const sortStage: any = {};
    if (sortPrice === 'asc') {
      sortStage.price = 1;
    } else if (sortPrice === 'desc') {
      sortStage.price = -1;
    }

    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }

    const paginatedPipeline = [
      ...pipeline,
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      {
        $project: {
          books: '$data',
          total: { $arrayElemAt: ['$metadata.total', 0] },
          page: { $literal: page },
          limit: { $literal: limit },
        },
      },
    ];

    const result = await this.bookModel.aggregate(paginatedPipeline).exec();

    if (result.length > 0) {
      const { books, total, page: currentPage, limit: pageLimit } = result[0];

      const now = new Date();
      const flashSale = await this.flashSaleModel
        .findOne({
          start_time: { $lte: now },
          end_time: { $gte: now },
        })
        .populate('books.book_id')
        .lean();

      const flashSaleMap = new Map<string, number>();
      if (flashSale?.books?.length) {
        for (const item of flashSale.books) {
          console.log(item, 'check item');
          flashSaleMap.set(item?.book_id?._id.toString(), item.price);
        }
      }

      const booksWithFlashSale = books.map((book) => {
        const bookId = book._id.toString();
        const discountPrice = flashSaleMap.get(bookId);
        if (discountPrice !== undefined) {
          return {
            id: bookId,
            ...book,
            original_price: book.price,
            price: discountPrice,
            is_flash_sale: true,
            flash_sale_ends_at: flashSale.end_time,
          };
        }
        return {
          id: bookId,
          ...book,
          is_flash_sale: false,
        };
      });

      return {
        books: booksWithFlashSale,
        pagination: {
          currentPage,
          pageSize: pageLimit,
          totalItems: total || 0,
          totalPages: Math.ceil((total || 0) / pageLimit),
        },
      };
    }

    return {
      books: [],
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: 0,
        totalPages: 0,
      },
    };
  }
}
