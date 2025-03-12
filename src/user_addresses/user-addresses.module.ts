import { Module } from '@nestjs/common';
import { UserAddressesService } from './user-addresses.service';
import { UserAddressesController } from './user-addresses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAddress, UserAddressSchema } from './schemas/user-address.schema';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserAddress.name, schema: UserAddressSchema },
    ]),
  ],
  controllers: [UserAddressesController],
  providers: [UserAddressesService, FilesService],
  exports: [UserAddressesService],
})
export class UserAddressesModule {}
