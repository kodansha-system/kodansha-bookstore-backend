import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FlashSaleDocument = HydratedDocument<FlashSale>;

@Schema({ timestamps: true })
export class FlashSale {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  start_time: Date;

  @Prop({ required: true })
  end_time: Date;

  @Prop([
    {
      book_id: { type: Types.ObjectId, ref: 'Book', required: true },
      quantity: { type: Number, required: true, min: 1 },
      price: { type: Number, required: true, min: 1 },
      sold: { type: Number, default: 0 },
    },
  ])
  books: {
    book_id: Types.ObjectId;
    quantity: number;
    price: number;
    sold: number;
  }[];

  @Prop({ default: false })
  is_processed: boolean;
}

export const FlashSaleSchema = SchemaFactory.createForClass(FlashSale);
