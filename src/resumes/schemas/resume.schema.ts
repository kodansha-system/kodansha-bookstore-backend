import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ResumeDocument = HydratedDocument<Resume>;

@Schema()
export class Resume {
  @Prop()
  email: string;

  @Prop()
  user_id: mongoose.Schema.Types.ObjectId;

  @Prop()
  company_id: mongoose.Schema.Types.ObjectId;

  @Prop()
  url: string;

  @Prop()
  status: string; // PENDING-REVIEWING-APPROVED-REJECTED

  @Prop()
  job_id: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.Array })
  history: {
    status: string;
    updatedAt: Date;
    updatedBy: {
      _id: mongoose.Schema.Types.ObjectId;
      email: string;
    };
  }[];

  @Prop({ type: Object })
  createdBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  updatedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop({ type: Object })
  deletedBy: {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
  };

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;
}

export const ResumeSchema = SchemaFactory.createForClass(Resume);
