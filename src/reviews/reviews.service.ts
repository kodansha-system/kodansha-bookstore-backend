import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';
import { OrderStatus } from 'src/utils/enums';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
import { Types } from 'mongoose';
@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private reviewModel: SoftDeleteModel<ReviewDocument>,

    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    const orderDoc = await this.orderModel.findById(createReviewDto.order_id);

    const order = orderDoc?.toObject();

    if (!order) {
      throw new BadRequestException('Đơn hàng không tồn tại');
    }

    if (order.user_id.toString() !== user._id.toString()) {
      throw new ForbiddenException('Bạn không có quyền đánh giá đơn hàng này');
    }

    if (order.order_status !== OrderStatus.Completed) {
      throw new BadRequestException(
        'Chỉ có thể đánh giá đơn hàng đã hoàn thành',
      );
    }

    let imageUrl: string | undefined;

    if (file) {
      this.fileService.validateFile(file);
      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });
      imageUrl = image.url;
    }

    const review = await this.reviewModel.create({
      ...createReviewDto,
      ...(imageUrl && { image: imageUrl }),
      created_by: user._id,
    });

    const book = await this.bookModel.findById(createReviewDto.book_id);

    if (!book) {
      throw new BadRequestException('Sách không tồn tại');
    }

    const currentRating = book.rating || {
      count: {
        oneStar: 0,
        twoStar: 0,
        threeStar: 0,
        fourStar: 0,
        fiveStar: 0,
      },
      average: 0,
    };

    const rating = +createReviewDto.rating;

    const count = { ...currentRating.count };

    switch (rating) {
      case 1:
        count.oneStar++;
        break;
      case 2:
        count.twoStar++;
        break;
      case 3:
        count.threeStar++;
        break;
      case 4:
        count.fourStar++;
        break;
      case 5:
        count.fiveStar++;
        break;
      default:
        throw new BadRequestException('Số sao không hợp lệ');
    }

    // Tổng số lượt đánh giá
    const totalCount =
      count.oneStar +
      count.twoStar +
      count.threeStar +
      count.fourStar +
      count.fiveStar;

    // Tổng số sao
    const totalStars =
      1 * count.oneStar +
      2 * count.twoStar +
      3 * count.threeStar +
      4 * count.fourStar +
      5 * count.fiveStar;

    // Cập nhật lại rating
    const average = totalCount > 0 ? totalStars / totalCount : 0;

    const modifiedBook = await this.bookModel.findByIdAndUpdate(
      createReviewDto.book_id,
      {
        rating: {
          count,
          average: Math.round(average * 10) / 10,
        },
      },
    );

    return {
      review,
    };
  }

  async findAll(query) {
    const { current = 1, pageSize = 10, keyword, ...restQuery } = query;

    const offset = (+current - 1) * +pageSize;
    const defaultLimit = +pageSize || 10;

    const { filter, sort, population, projection } = aqp(restQuery);

    // Nếu có keyword thì tìm theo content
    if (keyword) {
      filter.$or = [{ content: { $regex: keyword, $options: 'i' } }];
    }

    const totalItems = await this.reviewModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.reviewModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .populate([
        {
          path: 'reply.staff_id',
          select: 'name',
        },
        {
          path: 'created_by',
          select: 'name image',
        },
      ])
      .select(projection)
      .sort((sort as any) || '-createdAt')
      .exec();

    return {
      meta: {
        currentPage: +current,
        pageSize: defaultLimit,
        totalItems,
        totalPages,
      },
      reviews: result,
    };
  }

  async findOne(id: string) {
    return await this.reviewModel.findById(id).populate({
      path: 'reply.staff_id',
      select: 'name',
    });
  }

  async verifiedReview(id: string, isVerified: boolean) {
    return this.reviewModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { is_verified: isVerified } },
    );
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });

      const updateReview = await this.reviewModel.updateOne(
        { _id: id },
        { ...updateReviewDto, image: image.url, updated_by: user._id },
      );

      return updateReview;
    }

    const updateReview = await this.reviewModel.updateOne(
      { _id: id },
      { ...updateReviewDto, updated_by: user._id },
    );

    return updateReview;
  }

  async replyReview(id: string, content: string, user: IUserBody) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review không tồn tại');

    review.reply = {
      content,
      created_at: new Date(),
      staff_id: new Types.ObjectId(user._id),
    };

    await review.save();
    return { message: 'Đã hồi đáp review thành công' };
  }

  remove(id: string, user: IUserBody) {
    return this.reviewModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
