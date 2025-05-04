import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class AuthorsService {
  constructor(
    @InjectModel(Author.name)
    private authorModel: SoftDeleteModel<AuthorDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createAuthorDto: CreateAuthorDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const author = await this.authorModel.create({
      ...createAuthorDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      author,
    };
  }

  async findAll(query) {
    const { name, current = 1, pageSize = 10, sort_order, get_all } = query;

    const filter: any = {};

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    const sort: any = {};
    if (sort_order) {
      sort.name = sort_order === 'desc' ? -1 : 1;
    }

    let skip = 0;
    let limit = 10;

    if (get_all !== 'true') {
      skip = (+current - 1) * +pageSize;
      limit = +pageSize || 10;
    }

    const totalItems = await this.authorModel.countDocuments(filter);
    const totalPages = get_all === 'true' ? 1 : Math.ceil(totalItems / limit);

    const result = await this.authorModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(get_all === 'true' ? 0 : limit)
      .exec();

    return {
      meta: {
        currentPage: +current,
        pageSize: get_all === 'true' ? totalItems : limit,
        totalItems,
        totalPages,
      },
      authors: result,
    };
  }

  async findOne(id: string) {
    return await this.authorModel.findById(id).populate([
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
    updateAuthorDto: UpdateAuthorDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const updateAuthor = await this.authorModel.updateOne(
        { _id: id },
        { ...updateAuthorDto, image: image.url, updated_by: user._id },
      );

      return updateAuthor;
    }
    const updateAuthor = await this.authorModel.updateOne(
      { _id: id },
      { ...updateAuthorDto, updated_by: user._id },
    );

    return updateAuthor;
  }

  remove(id: string, user: IUserBody) {
    return this.authorModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
