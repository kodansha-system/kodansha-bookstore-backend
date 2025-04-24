import { Module } from '@nestjs/common';
import { StaffsService } from './staffs.service';
import { StaffsController } from './staffs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Staff, StaffSchema } from './schemas/staff.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';
import { FilesService } from 'src/files/files.service';
import { Shop, ShopSchema } from 'src/shops/schemas/shop.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Staff.name, schema: StaffSchema },
      { name: Shop.name, schema: ShopSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [StaffsController],
  providers: [StaffsService, FilesService],
  exports: [StaffsService],
})
export class StaffsModule {}
