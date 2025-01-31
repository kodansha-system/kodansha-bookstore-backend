import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto } from './dto/create-user.dto';
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

  async register(createUserDto: RegisterUserDto) {
    const { password, email } = createUserDto;

    const isExisted = await this.userModel.findOne({ email });
    if (isExisted) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const hashPassword = this.getHashPassword(password);
    const user = await this.userModel.create({
      ...createUserDto,
      password: hashPassword,
      role: 'USER',
    });
    return user;
  }

  async findAll(query) {
    const { filter, sort, population } = aqp(query);

    const offset = (+filter?.current || 1 - 1) * filter?.pageSize;
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
      .populate(population)
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
    return this.userModel.findById(id);
  }

  findOneByUsername(username: string) {
    return this.userModel.findOne({
      email: username,
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: IUser) {
    const user: any = await this.userModel.findById(id);
    if (updateUserDto?.password) {
      const { password } = updateUserDto;
      const hashPassword = this.getHashPassword(password);
      const updatedUser = await this.userModel.updateOne(user, {
        ...updateUserDto,
        password: hashPassword,
        updatedBy,
      });
      return updatedUser;
    }
    const updatedUser = await this.userModel.updateOne(user, {
      ...updateUserDto,
      updatedBy,
    });
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
    return this.userModel.findOne({ refreshToken });
  };
}
