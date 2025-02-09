import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriberDocument = HydratedDocument<Subscriber>;

@Schema({ timestamps: true })
export class Subscriber {
  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  skills: string[];
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);
