import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { Company, CompanyDocument } from 'src/companies/schemas/company.schema';
import { IUser } from './users.interface';
import aqp from 'api-query-params';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Company.name)
    private companyModel: SoftDeleteModel<CompanyDocument>,
  ) {}

  getHashPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  };

  async createNewUser(createUserDto: CreateUserDto, createdBy: IUser) {
    const { password } = createUserDto;
    const hashPassword = this.getHashPassword(password);

    const company: any = await this.companyModel.findById(
      createUserDto.company_id,
    );

    if (company) {
      const user = await this.userModel.create({
        ...createUserDto,
        username:
          createUserDto.username ||
          `user${crypto.randomUUID().substring(0, 8)}`,
        password: hashPassword,
        company: {
          _id: company?._id,
          name: company?.name,
        },
        createdBy,
      });
      return {
        _id: user?._id,
        createdAt: user?.createdAt,
        createdBy: user?.createdBy,
      };
    }

    return 'Công ty không tồn tại';
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

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: IUser) {
    const user: any = await this.userModel.findById(id);
    if (updateUserDto?.password) {
      const { password } = updateUserDto;
      const hashPassword = this.getHashPassword(password);
      const updatedUser = await this.userModel.updateOne(
        { _id: user?._doc?._id },
        {
          ...updateUserDto,
          password: hashPassword,
          updatedBy,
        },
      );
      return updatedUser;
    } else {
      const updatedUser = await this.userModel.updateOne(
        { _id: user?._doc?._id },
        {
          ...updateUserDto,
          updatedBy,
        },
      );
      return updatedUser;
    }
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
}
