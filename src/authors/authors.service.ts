import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Author, AuthorDocument } from './schemas/author.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
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
    user: IUser,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const author = await this.authorModel.create({
      ...createAuthorDto,
      image: image.url,
      createdBy: user,
    });

    return {
      author,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.authorModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.authorModel
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
      authors: result,
    };
  }

  async findOne(id: string) {
    return await this.authorModel.findById(id).populate({
      path: 'permissions',
      select: { name: 1, module: 1, api_path: 1, method: 1 },
    });
  }

  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    user: IUser,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const updateAuthor = await this.authorModel.updateOne(
        { _id: id },
        { ...updateAuthorDto, image: image.url, updatedBy: user },
      );

      return updateAuthor;
    }
    const updateAuthor = await this.authorModel.updateOne(
      { _id: id },
      { ...updateAuthorDto, updatedBy: user },
    );

    return updateAuthor;
  }

  remove(id: string, user: IUser) {
    return this.authorModel.updateOne(
      { _id: id },
      {
        deletedBy: user,
        isDeleted: true,
      },
    );
  }
}
