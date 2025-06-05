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
    isFlashSale?: boolean,
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

    // Match đầu tiên: lọc sách chưa xoá
    pipeline.push({
      $match: {
        $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
      },
    });

    const matchStage: any = {};

    // Lọc theo danh mục
    if (categoryId) {
      const categoryIds: string[] =
        typeof categoryId === 'string'
          ? categoryId.split(',').map((id) => id.trim())
          : categoryId;

      matchStage.category_id = {
        $in: categoryIds.map((id) => new Types.ObjectId(id)),
      };
    }

    // Lọc theo rating
    if (ratingGte !== undefined) {
      matchStage.rating_average = { $gte: ratingGte };
    }

    // Lọc theo tác giả
    if (authorId) {
      const authorIds: string[] =
        typeof authorId === 'string'
          ? authorId.split(',').map((id) => id.trim())
          : authorId;

      matchStage.authors = {
        $in: authorIds.map((id) => new Types.ObjectId(id)),
      };
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Join tác giả
    pipeline.push({
      $lookup: {
        from: 'authors',
        localField: 'authors',
        foreignField: '_id',
        as: 'authorDetails',
      },
    });

    // Join danh mục
    pipeline.push({
      $lookup: {
        from: 'categories',
        localField: 'category_id',
        foreignField: '_id',
        as: 'category',
      },
    });

    pipeline.push({ $unwind: '$category' });

    // Join với flash sale để biết sách nào đang flash
    pipeline.push({
      $lookup: {
        from: 'flashsales',
        let: { bookId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $lte: ['$start_time', new Date()] },
                  { $gte: ['$end_time', new Date()] },
                  {
                    $in: [
                      '$$bookId',
                      {
                        $map: {
                          input: '$books',
                          as: 'b',
                          in: '$$b.book_id',
                        },
                      },
                    ],
                  },
                ],
              },
            },
          },
          { $project: { books: 1, end_time: 1 } },
        ],
        as: 'flashSaleDetails',
      },
    });

    // Gắn cờ flash sale
    pipeline.push({
      $addFields: {
        is_flash_sale: {
          $gt: [{ $size: '$flashSaleDetails' }, 0],
        },
      },
    });

    // Nếu người dùng chỉ muốn sách đang flash sale
    if (isFlashSale === true) {
      pipeline.push({
        $match: {
          is_flash_sale: true,
        },
      });
    }

    // Lọc theo keyword
    if (keyword) {
      const searchPattern = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      pipeline.push({
        $match: {
          name: { $regex: searchPattern, $options: 'i' },
        },
      });
    }

    // Sắp xếp
    const sortStage: any = {};
    if (sortPrice === 'asc') {
      sortStage.price = 1;
    } else if (sortPrice === 'desc') {
      sortStage.price = -1;
    } else {
      sortStage.total_sold = -1;
    }

    pipeline.push({ $sort: sortStage });

    // Phân trang
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

      const flashSaleMap = new Map<string, { price: number; endsAt: Date }>();
      if (flashSale?.books?.length) {
        for (const item of flashSale.books) {
          if (item.book_id?._id) {
            flashSaleMap.set(item.book_id._id.toString(), {
              price: item.price,
              endsAt: flashSale.end_time,
            });
          }
        }
      }

      const booksWithFlashSale = books.map((book) => {
        const bookId = book._id.toString();
        const flashInfo = flashSaleMap.get(bookId);

        if (flashInfo) {
          return {
            id: bookId,
            ...book,
            original_price: book.price,
            price: flashInfo.price,
            is_flash_sale: true,
            flash_sale_ends_at: flashInfo.endsAt,
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
