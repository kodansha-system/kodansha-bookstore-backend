import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { Staff, StaffDocument } from './schemas/staff.schema';
import { InjectModel } from '@nestjs/mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IStaff } from './staffs.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
@Injectable()
export class StaffsService {
  constructor(
    @InjectModel(Staff.name)
    private staffModel: SoftDeleteModel<StaffDocument>,

    private fileService: FilesService,
  ) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async createNewStaff(
    createStaffDto: CreateStaffDto,
    created_by: IStaff,
    file?: Express.Multer.File,
  ) {
    const { password } = createStaffDto;
    const hashPassword = this.getHashPassword(password);

    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const staff = await this.staffModel.create({
        ...createStaffDto,
        password: hashPassword,
        image: image.url,
        created_by,
      });

      return {
        _id: staff?._id,
        createdAt: staff?.createdAt,
        created_by: staff?.created_by,
      };
    }

    const staff = await this.staffModel.create({
      ...createStaffDto,
      password: hashPassword,
      created_by,
    });

    return {
      _id: staff?._id,
      createdAt: staff?.createdAt,
      created_by: staff?.created_by,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.staffModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.staffModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate({
        path: 'role',
        select: 'name',
      })
      // .projection(projection)
      .exec();

    return {
      meta: {
        currentPage: filter?.current || 1,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      staffs: result,
    };
  }

  findOne(id: string) {
    return this.staffModel.findById(id).populate({
      path: 'role',
      select: { name: 1, permissions: 1 },
      populate: { path: 'permissions', select: { name: 1 } },
    });
  }

  async findOneByStaffEmail(email: string) {
    return await this.staffModel
      .findOne({ email: email })
      .select('+password')
      .exec();
  }

  async update(
    id: string,
    updateStaffDto: UpdateStaffDto,
    updated_by: IStaff,
    file?: Express.Multer.File,
  ) {
    const staff: any = await this.staffModel.findById(id);
    if (updateStaffDto?.password) {
      const { password } = updateStaffDto;
      const hashPassword = this.getHashPassword(password);

      if (file) {
        this.fileService.validateFile(file);

        const image = await this.fileService.uploadImage(file).catch(() => {
          throw new BadRequestException('Invalid file type.');
        });

        const updatedStaff = await this.staffModel.updateOne(
          { _id: staff?._doc?._id },
          {
            ...updateStaffDto,
            password: hashPassword,
            image: image.url,
            updated_by,
          },
        );

        return updatedStaff;
      }

      const updatedStaff = await this.staffModel.updateOne(
        { _id: staff?._doc?._id },
        {
          ...updateStaffDto,
          password: hashPassword,
          updated_by,
        },
      );

      return updatedStaff;
    } else {
      const updatedStaff = await this.staffModel.updateOne(
        { _id: staff?._doc?._id },
        {
          ...updateStaffDto,
          updated_by,
        },
      );

      return updatedStaff;
    }
  }

  async remove(id: string, deletedBy: IStaff) {
    const staff: any = await this.staffModel.findById(id);
    await this.staffModel.updateOne(staff, {
      deletedBy,
    });
    const data = await this.staffModel.softDelete({ _id: id });
    return data;
  }

  isValidPassword = (password: string, hashPassword: string) => {
    return compareSync(password, hashPassword);
  };

  updateStaffToken = async (refreshToken: string, _id: string) => {
    return await this.staffModel.updateOne(
      { _id },
      {
        refreshToken,
      },
    );
  };

  findStaffByToken = async (refreshToken: string) => {
    return this.staffModel
      .findOne({ refreshToken })
      .populate({ path: 'role', select: { name: 1 } });
  };

  findByEmail = async (email: string) => {
    return this.staffModel.findOne({ email });
  };

  updatePassword = async (email: string, password: string) => {
    return this.staffModel.updateOne({ email }, { password });
  };
}
