import { Module } from '@nestjs/common';
import { PayMethodsService } from './paymethods.service';
import { PayMethodsController } from './paymethods.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PayMethod, PayMethodSchema } from './schemas/paymethod.schema';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PayMethod.name, schema: PayMethodSchema },
    ]),
  ],
  controllers: [PayMethodsController],
  providers: [PayMethodsService, FilesService],
  exports: [PayMethodsService],
})
export class PayMethodsModule {}
