import { IsMongoId, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  reply_to?: string;

  @IsMongoId()
  article_id: Types.ObjectId;

  @IsOptional()
  created_by: Types.ObjectId;
}
