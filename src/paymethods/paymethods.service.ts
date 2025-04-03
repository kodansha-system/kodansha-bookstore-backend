import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePayMethodDto } from './dto/create-paymethod.dto';
import { UpdatePayMethodDto } from './dto/update-paymethod.dto';
import { InjectModel } from '@nestjs/mongoose';
import { PayMethod, PayMethodDocument } from './schemas/paymethod.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class PayMethodsService {
  constructor(
    @InjectModel(PayMethod.name)
    private payMethodModel: SoftDeleteModel<PayMethodDocument>,
    private fileService: FilesService,
  ) {}

  async create(
    createPayMethodDto: CreatePayMethodDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const payMethod = await this.payMethodModel.create({
      ...createPayMethodDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      payMethod,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.payMethodModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.payMethodModel
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
      payMethods: result,
    };
  }

  async findOne(id: string) {
    return await this.payMethodModel.findById(id).populate([
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
    updatePayMethodDto: UpdatePayMethodDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const updatePayMethod = await this.payMethodModel.updateOne(
        { _id: id },
        { ...updatePayMethodDto, image: image.url, updated_by: user._id },
      );

      return updatePayMethod;
    }
    const updatePayMethod = await this.payMethodModel.updateOne(
      { _id: id },
      { ...updatePayMethodDto, updated_by: user._id },
    );

    return updatePayMethod;
  }

  remove(id: string, user: IUserBody) {
    return this.payMethodModel.updateOne(
      { _id: id },
      {
        deleted_by: user._id,
        isDeleted: true,
      },
    );
  }
}
