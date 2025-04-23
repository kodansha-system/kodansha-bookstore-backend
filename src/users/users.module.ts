import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';
import { FilesService } from 'src/files/files.service';
import { Shop, ShopSchema } from 'src/shops/schemas/shop.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Shop.name, schema: ShopSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, FilesService],
  exports: [UsersService],
})
export class UsersModule {}
