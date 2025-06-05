import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUserBody } from 'src/users/users.interface';
import aqp from 'api-query-params';
import { FilesService } from 'src/files/files.service';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';
import { OrderStatus } from 'src/utils/enums';
import { Book, BookDocument } from 'src/books/schemas/book.schema';
import { Types } from 'mongoose';
@Injectable()
export class QuestionsService {
  constructor(
    @InjectModel(Question.name)
    private questionModel: SoftDeleteModel<QuestionDocument>,

    @InjectModel(Order.name)
    private orderModel: SoftDeleteModel<OrderDocument>,

    @InjectModel(Book.name)
    private bookModel: SoftDeleteModel<BookDocument>,

    private fileService: FilesService,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    let imageUrl: string | undefined;

    const question = await this.questionModel.create({
      ...createQuestionDto,
      ...(imageUrl && { image: imageUrl }),
      created_by: user._id,
    });

    return {
      question,
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

    const totalItems = await this.questionModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.questionModel
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
      questions: result,
    };
  }

  async findOne(id: string) {
    return await this.questionModel.findById(id).populate({
      path: 'reply.staff_id',
      select: 'name',
    });
  }

  async verifiedQuestion(id: string, isVerified: boolean) {
    return this.questionModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { is_verified: isVerified } },
    );
  }

  async update(
    id: string,
    updateQuestionDto: UpdateQuestionDto,
    user: IUserBody,
    file?: Express.Multer.File,
  ) {
    if (file) {
      this.fileService.validateFile(file);

      const image = await this.fileService.uploadImage(file).catch((e) => {
        console.log(e);
        throw new BadRequestException('Có lỗi xảy ra khi tải file');
      });

      const updateQuestion = await this.questionModel.updateOne(
        { _id: id },
        { ...updateQuestionDto, image: image.url, updated_by: user._id },
      );

      return updateQuestion;
    }

    const updateQuestion = await this.questionModel.updateOne(
      { _id: id },
      { ...updateQuestionDto, updated_by: user._id },
    );

    return updateQuestion;
  }

  async replyQuestion(id: string, content: string, user: IUserBody) {
    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('Question không tồn tại');

    question.reply = {
      content,
      created_at: new Date(),
      staff_id: new Types.ObjectId(user._id),
    };

    await question.save();
    return { message: 'Đã hồi đáp question thành công' };
  }

  remove(id: string, user: IUserBody) {
    return this.questionModel.updateOne(
      { _id: id },
      {
        deletedBy: user._id,
        isDeleted: true,
      },
    );
  }
}
