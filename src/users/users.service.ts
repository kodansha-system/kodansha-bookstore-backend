import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import { Types } from 'mongoose';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    private fileService: FilesService,
  ) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async createNewUser(
    createUserDto: CreateUserDto,
    created_by: IUser,
    file?: Express.Multer.File,
  ) {
    const { password } = createUserDto;
    const hashPassword = this.getHashPassword(password);

    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch(() => {
        throw new BadRequestException('Invalid file type.');
      });

      const user = await this.userModel.create({
        ...createUserDto,
        username:
          createUserDto.username ||
          `user${crypto.randomUUID().substring(0, 8)}`,
        password: hashPassword,
        image: image.url,
        created_by,
      });

      return {
        _id: user?._id,
        createdAt: user?.createdAt,
        created_by: user?.created_by,
      };
    }

    const user = await this.userModel.create({
      ...createUserDto,
      username:
        createUserDto.username || `user${crypto.randomUUID().substring(0, 8)}`,
      password: hashPassword,
      created_by,
    });

    return {
      _id: user?._id,
      createdAt: user?.createdAt,
      created_by: user?.created_by,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.userModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.userModel
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
      users: result,
    };
  }

  findOne(id: string) {
    return this.userModel.findById(id).populate({
      path: 'role',
      select: { name: 1, permissions: 1 },
      populate: { path: 'permissions', select: { name: 1 } },
    });
  }

  async getUserInfor(id: string) {
    const infor = await this.userModel.findById(id).select('-password');
    return infor;
  }

  async findOneByUsername(username: string) {
    return await this.userModel
      .findOne({
        $or: [{ email: username }, { username: username }],
      })
      .populate({
        path: 'role',
        select: { name: 1 },
      })
      .select('+password')
      .exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updated_by: IUser,
    file?: Express.Multer.File,
  ) {
    const user: any = await this.userModel.findById(id);

    const updateData: any = { ...updateUserDto, updated_by };

    if (updateUserDto?.password) {
      const { password } = updateUserDto;
      const hashPassword = this.getHashPassword(password);
      updateData.password = hashPassword;
    }

    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Invalid file type.');
      });

      updateData.image = image.url;
    }

    const updatedUser = await this.userModel.updateOne(
      { _id: user?._doc?._id },
      updateData,
    );

    return updatedUser;
  }

  async remove(id: string, deletedBy: IUser) {
    const user: any = await this.userModel.findById(id);
    await this.userModel.updateOne(user, {
      deletedBy,
    });
    const data = await this.userModel.softDelete({ _id: id });
    return data;
  }

  isValidPassword = (password: string, hashPassword: string) => {
    return compareSync(password, hashPassword);
  };

  updateUserToken = async (refreshToken: string, _id: string) => {
    return await this.userModel.updateOne(
      { _id },
      {
        refreshToken,
      },
    );
  };

  findUserByToken = async (refreshToken: string) => {
    return this.userModel
      .findOne({ refreshToken })
      .populate({ path: 'role', select: { name: 1 } });
  };

  findByEmail = async (email: string) => {
    return this.userModel.findOne({ email });
  };

  updatePassword = async (email: string, password: string) => {
    return this.userModel.updateOne({ email }, { password });
  };

  async addAddress(userId: string, addressDto: any) {
    if (addressDto.is_default) {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { 'addresses.$[].is_default': false } },
      );
    }

    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            addresses: {
              ...addressDto,
              id: new Types.ObjectId(),
            },
          },
        },
        { new: true },
      )
      .select('-password');
  }

  async updateAddress(userId: string, addressId: string, addressDto: any) {
    const updateObj = {};
    for (const key in addressDto) {
      updateObj[`addresses.$.${key}`] = addressDto[key];
    }

    if (addressDto.is_default) {
      await this.userModel.updateOne(
        { _id: userId },
        { $set: { 'addresses.$[].is_default': false } },
      );
    }

    console.log(addressId, updateObj);

    return this.userModel
      .findOneAndUpdate(
        { _id: userId, 'addresses.id': new Types.ObjectId(addressId) },
        { $set: updateObj },
        { new: true },
      )
      .select('-password');
  }

  async getAddresses(userId: string) {
    return this.userModel.findById({ _id: userId }).select('addresses');
  }

  async deleteAddress(userId: string, addressId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { addresses: { id: new Types.ObjectId(addressId) } } },
        { new: true },
      )
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }
}
