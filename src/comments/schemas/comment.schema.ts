import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop()
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  created_by: string;

  @Prop()
  reply_to?: string;

  @Prop({ type: Types.ObjectId, ref: 'Article' })
  article_id: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
