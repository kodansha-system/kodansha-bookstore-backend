import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;
export class RatingCount {
  @Prop({ default: 0 }) oneStar: number;
  @Prop({ default: 0 }) twoStar: number;
  @Prop({ default: 0 }) threeStar: number;
  @Prop({ default: 0 }) fourStar: number;
  @Prop({ default: 0 }) fiveStar: number;
}

export class Rating {
  @Prop({ type: RatingCount }) count: RatingCount;
  @Prop({ default: 0 }) average: number;
}
@Schema({ timestamps: true })
export class Book {
  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Author' }] })
  authors: mongoose.Schema.Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }] })
  categories: mongoose.Schema.Types.ObjectId[];

  @Prop()
  name: string;

  @Prop()
  images: string[];

  @Prop()
  total_sold: number;

  @Prop()
  company_publish: string;

  @Prop()
  width: number;

  @Prop()
  length: number;

  @Prop()
  height: number;

  @Prop()
  weight: number;

  @Prop()
  cover_type: string;

  @Prop()
  total_pages: number;

  @Prop()
  price: number;

  @Prop()
  discount: number;

  @Prop()
  description: string;

  @Prop()
  quantity: number;

  @Prop({ type: Rating })
  rating: Rating;

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

export const BookSchema = SchemaFactory.createForClass(Book);
