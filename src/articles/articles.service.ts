import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name)
    private articleModel: SoftDeleteModel<ArticleDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    console.log(createArticleDto);
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch((e) => {
      console.log(e);
      throw new BadRequestException('Có lỗi xảy ra khi tải file');
    });

    const article = await this.articleModel.create({
      ...createArticleDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      article,
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

    // Nếu có keyword thì tìm theo title hoặc content
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ];
    }

    const totalItems = await this.articleModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const queryBuilder = this.articleModel
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
      articles: result,
    };
  }

  async findOne(id: string) {
    return await this.articleModel.findById(id).populate([
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

  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });

      const updateArticle = await this.articleModel.updateOne(
        { _id: id },
        { ...updateArticleDto, image: image.url, updated_by: user._id },
      );

      return updateArticle;
    }

    const updateArticle = await this.articleModel.updateOne(
      { _id: id },
      { ...updateArticleDto, updated_by: user._id },
    );

    return updateArticle;
  }

  remove(id: string, user: IUserBody) {
    return this.articleModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
