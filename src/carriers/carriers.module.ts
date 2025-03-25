import { Module } from '@nestjs/common';
import { CarriersService } from './carriers.service';
import { CarriersController } from './carriers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Carrier, CarrierSchema } from './schemas/carrier.schema';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Carrier.name, schema: CarrierSchema }]),
  ],
  controllers: [CarriersController],
  providers: [CarriersService, FilesService],
  exports: [CarriersService],
})
export class CarriersModule {}
