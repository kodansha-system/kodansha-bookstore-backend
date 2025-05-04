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
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.articleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.articleModel
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
