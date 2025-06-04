import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CommentService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { User } from 'src/decorator/customize';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(@Body() dto: CreateCommentDto, @User() user) {
    return this.commentService.create(dto, user);
  }

  @Get('article/:articleId')
  async getByArticle(@Param('articleId') articleId: string) {
    return this.commentService.findByArticle(articleId);
  }
}
