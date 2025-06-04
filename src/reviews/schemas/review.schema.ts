import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ timestamps: true })
export class Review {
  @Prop()
  content: string;

  @Prop()
  image: string;

  @Prop()
  rating: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Book' })
  book_id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order' })
  order_id: mongoose.Types.ObjectId;

  @Prop()
  is_verified: boolean;

  @Prop({
    type: {
      content: String,
      created_at: Date,
      staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
    },
    default: null,
  })
  reply: {
    content: string;
    created_at: Date;
    staff_id: mongoose.Types.ObjectId;
  };

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

export const ReviewSchema = SchemaFactory.createForClass(Review);
