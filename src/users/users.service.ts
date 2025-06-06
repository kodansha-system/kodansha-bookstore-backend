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
    const { password, email } = createUserDto;
    const hashPassword = this.getHashPassword(password);

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

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
    const {
      keyword,
      current = 1,
      pageSize = 10,
      sort = { createdAt: -1 },
    } = query;

    const filter: Record<string, any> = {};

    if (keyword) {
      const regex = { $regex: keyword, $options: 'i' };
      filter.$or = [{ name: regex }, { email: regex }, { phone_number: regex }];
    }

    const offset = (+current - 1) * +pageSize;

    const totalItems = await this.userModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / +pageSize);

    const users = await this.userModel
      .find(filter)
      .skip(offset)
      .limit(+pageSize)
      .sort(sort)
      .populate({
        path: 'role',
        select: 'name',
      })
      .exec();

    return {
      meta: {
        currentPage: +current,
        pageSize: +pageSize,
        totalItems,
        totalPages,
      },
      users,
    };
  }

  findOne(id: string) {
    return this.userModel.findById(id).select('-password');
  }

  async getUserInfor(id: string) {
    const infor: any = await this.userModel.findById(id).select('-password');
    console.log(infor, 'check infor ', id);
    return infor?._doc;
  }

  async findOneByUsername(username: string) {
    return await this.userModel
      .findOne({
        $or: [{ email: username }, { username: username }],
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
    const user = await this.userModel.findById(userId).select('addresses');

    const hasAddresses = user && user.addresses && user.addresses.length > 0;

    if (hasAddresses) {
      if (addressDto.is_default) {
        await this.userModel.updateOne(
          { _id: userId },
          { $set: { 'addresses.$[].is_default': false } },
        );
      }
    } else {
      addressDto.is_default = true;
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

  async getAddresses(userId: string, is_default: boolean) {
    if (!is_default)
      return this.userModel.findById({ _id: userId }).select('addresses');

    const user = await this.userModel
      .findOne({ _id: userId })
      .select('addresses')
      .lean();

    const defaultAddress = user?.addresses?.find(
      (address) => address.is_default,
    );

    return defaultAddress;
  }

  async deleteAddress(userId: string, addressId: string) {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(addressId)) {
      throw new BadRequestException('Invalid ID format');
    }

    const user = await this.userModel.findById(userId).select('addresses');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressToDelete = user.addresses.find(
      (address: any) => address.id.toString() === addressId,
    );

    if (!addressToDelete) {
      throw new NotFoundException('Address not found');
    }

    const isDefault = addressToDelete.is_default;

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { addresses: { id: new Types.ObjectId(addressId) } } },
        { new: true },
      )
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException('User not found after deletion');
    }

    if (isDefault && updatedUser.addresses.length > 0) {
      const firstAddressId = updatedUser.addresses[0].id;

      await this.userModel.updateOne(
        { _id: userId, 'addresses.id': firstAddressId },
        { $set: { 'addresses.$.is_default': true } },
      );
    }

    return updatedUser;
  }
}
