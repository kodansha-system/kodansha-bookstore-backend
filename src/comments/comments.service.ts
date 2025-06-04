// comment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Comment } from './schemas/comment.schema';
import { Model } from 'mongoose';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name)
    private commentModel: Model<Comment>,
  ) {}

  async create(dto: CreateCommentDto, user) {
    console.log('create', dto);
    return this.commentModel.create({ ...dto, created_by: user?._id });
  }

  async findByArticle(article_id: string) {
    return this.commentModel
      .find({ article_id })
      .sort({ createdAt: 1 })
      .populate({
        path: 'created_by',
        select: 'name image',
      })
      .lean();
  }
}
