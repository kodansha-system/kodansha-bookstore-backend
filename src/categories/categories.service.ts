import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: SoftDeleteModel<CategoryDocument>,

    private fileService: FilesService,
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
      createdBy: user._id,
    });

    return {
      category,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.categoryModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.categoryModel
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
      categories: result,
    };
  }

  async findOne(id: string) {
    return await this.categoryModel.findById(id).populate([
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
    ]);
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
        { ...updateCategoryDto, image: image.url, updatedBy: user._id },
      );

      return updateCategory;
    }
    const updateCategory = await this.categoryModel.updateOne(
      { _id: id },
      { ...updateCategoryDto, updatedBy: user._id },
    );

    return updateCategory;
  }

  remove(id: string, user: IUserBody) {
    return this.categoryModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
