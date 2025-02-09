import { Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscribers.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser, IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,
  ) {}

  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const subscriber = await this.subscriberModel.create({
      ...createSubscriberDto,
      createdBy: user,
    });

    return {
      subscriber,
    };
  }

  async findAll(query) {
    const { filter, sort, population, projection } = aqp(query);

    const offset = (+filter?.current - 1) * filter?.pageSize;
    const defaultLimit = +filter?.pageSize || 10;

    delete filter?.current;
    delete filter?.pageSize;

    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.subscriberModel
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
      subscribers: result,
    };
  }

  async findOne(id: string) {
    return await this.subscriberModel.findById(id);
  }

  async update(updateSubscriberDto: UpdateSubscriberDto, user: IUserBody) {
    const updateSubscriber = await this.subscriberModel.updateOne(
      { email: user?.email },
      { ...updateSubscriberDto, updatedBy: user },
      { upsert: true },
    );

    return updateSubscriber;
  }

  remove(id: string, user: IUser) {
    return this.subscriberModel.updateOne(
      { _id: id },
      {
        deletedBy: user,
        isDeleted: true,
      },
    );
  }

  async getSkills(user: IUserBody) {
    const { email } = user;
    return await this.subscriberModel.findOne({ email }, { skills: 1 });
  }
}
