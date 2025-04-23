import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type AuthorDocument = HydratedDocument<Author>;

@Schema({ timestamps: true })
export class Author {
  @Prop()
  name: string;

  @Prop()
  image: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  created_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  updated_by: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  deletedBy: mongoose.Schema.Types.ObjectId;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);
