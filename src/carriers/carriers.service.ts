import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Carrier, CarrierDocument } from './schemas/carrier.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class CarriersService {
  constructor(
    @InjectModel(Carrier.name)
    private carrierModel: SoftDeleteModel<CarrierDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createCarrierDto: CreateCarrierDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch(() => {
      throw new BadRequestException('Invalid file type.');
    });

    const carrier = await this.carrierModel.create({
      ...createCarrierDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      carrier,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.carrierModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.carrierModel
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
      carriers: result,
    };
  }

  async findOne(id: string) {
    return await this.carrierModel.findById(id).populate([
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
    updateCarrierDto: UpdateCarrierDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const updateCarrier = await this.carrierModel.updateOne(
        { _id: id },
        { ...updateCarrierDto, image: image.url, updated_by: user._id },
      );

      return updateCarrier;
    }
    const updateCarrier = await this.carrierModel.updateOne(
      { _id: id },
      { ...updateCarrierDto, updated_by: user._id },
    );

    return updateCarrier;
  }

  remove(id: string, user: IUserBody) {
    return this.carrierModel.updateOne(
      { _id: id },
      {
        deleted_by: user._id,
        isDeleted: true,
      },
    );
  }
}
