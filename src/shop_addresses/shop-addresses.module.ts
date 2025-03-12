import { Module } from '@nestjs/common';
import { ShopAddressesService } from './shop-addresses.service';
import { ShopAddressesController } from './shop-addresses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ShopAddress, ShopAddressSchema } from './schemas/shop-address.schema';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShopAddress.name, schema: ShopAddressSchema },
    ]),
  ],
  controllers: [ShopAddressesController],
  providers: [ShopAddressesService, FilesService],
  exports: [ShopAddressesService],
})
export class ShopAddressesModule {}
