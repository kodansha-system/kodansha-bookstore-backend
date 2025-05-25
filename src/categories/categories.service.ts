import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: SoftDeleteModel<CategoryDocument>,

    private fileService: FilesService,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const category = await this.categoryModel.create({
      ...createCategoryDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      category,
    };
  }

  async findAll(query) {
    const {
      current = 1,
      pageSize = 10,
      keyword,
      get_all,
      ...restQuery
    } = query;

    const isGetAll = get_all === 'true';

    if ('get_all' in restQuery) {
      delete restQuery.get_all;
    }

    const offset = (+current - 1) * +pageSize;
    const defaultLimit = +pageSize || 10;

    const { filter, sort, projection } = aqp(restQuery);

    if (keyword) {
      filter.$or = [{ content: { $regex: keyword, $options: 'i' } }];
    }

    const totalItems = await this.categoryModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const queryBuilder = this.categoryModel
      .find(filter)
      .sort(sort as any)
      .populate({ path: 'created_by', select: 'name' })
      .select(projection);

    if (!isGetAll) {
      queryBuilder.skip(offset).limit(defaultLimit);
    }

    const result = await queryBuilder.exec();

    return {
      meta: {
        currentPage: isGetAll ? 1 : +current,
        pageSize: isGetAll ? totalItems : defaultLimit,
        totalItems,
        totalPages: isGetAll ? 1 : totalPages,
      },
      categories: result,
    };
  }

  async findOne(id: string) {
    return await this.categoryModel.findById(id).populate([
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
    ]);
  }

  async findListShowOnDashboard() {
    const data = await this.categoryModel.find({
      is_show_on_dashboard: true,
    });
    console.log(data);
    return data;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const updateCategory = await this.categoryModel.updateOne(
        { _id: id },
        { ...updateCategoryDto, image: image.url, updated_by: user._id },
      );

      return updateCategory;
    }
    const updateCategory = await this.categoryModel.updateOne(
      { _id: id },
      { ...updateCategoryDto, updated_by: user._id },
    );

    return updateCategory;
  }

  async remove(id: string, user: IUserBody) {
    const bookCount = await this.bookModel.countDocuments({
      category_id: id,
    });

    if (bookCount > 0) {
      throw new BadRequestException(
        `Không thể xóa vì có ${bookCount} sách đang thuộc thư mục này.`,
      );
    }

    return this.categoryModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
