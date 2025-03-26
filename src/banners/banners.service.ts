import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private bannerModel: SoftDeleteModel<BannerDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createBannerDto: CreateBannerDto,
    user: IUserBody,
    file: Express.Multer.File,
  ) {
    this.fileService.validateFile(file);

    const image = await this.fileService.uploadImage(file).catch((e) => {
      console.log(e);
      throw new BadRequestException('Có lỗi xảy ra khi tải file');
    });

    const banner = await this.bannerModel.create({
      ...createBannerDto,
      image: image.url,
      created_by: user._id,
    });

    return {
      banner,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.bannerModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.bannerModel
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
      banners: result,
    };
  }

  async findOne(id: string) {
    return await this.bannerModel.findById(id).populate([
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
    updateBannerDto: UpdateBannerDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });

      const updateBanner = await this.bannerModel.updateOne(
        { _id: id },
        { ...updateBannerDto, image: image.url, updated_by: user._id },
      );

      return updateBanner;
    }

    const updateBanner = await this.bannerModel.updateOne(
      { _id: id },
      { ...updateBannerDto, updated_by: user._id },
    );

    return updateBanner;
  }

  remove(id: string, user: IUserBody) {
    return this.bannerModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
