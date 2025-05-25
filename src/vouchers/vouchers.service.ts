import { Injectable } from '@nestjs/common';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Voucher, VoucherDocument } from './schemas/voucher.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
@Injectable()
export class VouchersService {
  constructor(
    @InjectModel(Voucher.name)
    private voucherModel: SoftDeleteModel<VoucherDocument>,
  ) {}

  async create(createVoucherDto: CreateVoucherDto, user: IUserBody) {
    const voucher = await this.voucherModel.create({
      ...createVoucherDto,
      created_by: user._id,
    });

    return {
      voucher,
    };
  }

  async getListVoucherForOrder(order) {
    try {
      const now = new Date();

      const vouchers = await this.voucherModel.find({
        min_order_total_price: { $lt: order.price },
        start_time: { $lte: now },
        end_time: { $gte: now },
      });

      return vouchers;
    } catch (error) {
      console.log(error);
    }
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;
    const keyword =
      typeof filter?.keyword === 'string' ? filter.keyword.trim() : '';

    // Xoá để tránh lỗi khi dùng trong filter
    delete filter.current;
    delete filter.pageSize;
    delete filter.keyword;

    if (keyword) {
      filter.$or = [
        { code: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    const totalItems = (await this.voucherModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.voucherModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort('-createdAt')
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
      vouchers: result,
    };
  }

  async findOne(id: string) {
    return await this.voucherModel.findById(id);
  }

  async update(
    id: string,
    updateVoucherDto: UpdateVoucherDto,
    user: IUserBody,
  ) {
    try {
      return this.voucherModel.updateOne(
        { _id: id },
        {
          ...updateVoucherDto,
          updated_by: user._id,
        },
      );
    } catch (e) {
      console.log(e);
    }
  }

  remove(id: string, user: IUserBody) {
    return this.voucherModel.updateOne(
      { _id: id },
      {
        quantity: 0,
        deleted_by: user._id,
      },
    );
  }
}
