import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import {
  Permission,
  PermissionDocument,
} from 'src/permissions/schemas/permission.schema';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { UsersService } from 'src/users/users.service';
import { ADMIN_ROLE, INIT_PERMISSIONS, USER_ROLE } from './sample';

@Injectable()
export class DatabasesService implements OnModuleInit {
  constructor(
    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,

    @InjectModel(Permission.name)
    private permissionModel: SoftDeleteModel<PermissionDocument>,

    private configService: ConfigService,
    private userService: UsersService,
  ) {}
  async onModuleInit() {
    try {
      if (this.configService.get<string>('SHOULD_INIT') === 'true') {
        const countUsers = await this.userModel.count({});
        const countRoles = await this.roleModel.count({});
        const countPermissions = await this.permissionModel.count({});

        if (countPermissions === 0) {
          await this.permissionModel.insertMany(INIT_PERMISSIONS);
        }

        if (countRoles === 0) {
          const permissions = await this.permissionModel.find({}).select('_id');
          await this.roleModel.insertMany([
            {
              name: ADMIN_ROLE,
              description: 'admin có full permissions',
              is_active: true,
              permissions,
            },
            {
              name: USER_ROLE,
              description: 'Người dùng hệ thống',
              is_active: true,
              permissions: [],
            },
          ]);
        }

        if (countUsers === 0) {
          const adminRole = await this.roleModel
            .findOne({ name: ADMIN_ROLE })
            .select('_id');

          const userRole = await this.roleModel
            .findOne({ name: USER_ROLE })
            .select('_id');

          await this.userModel.insertMany([
            {
              name: 'Admin',
              email: 'admin@gmail.com',
              password: this.userService.getHashPassword(
                this.configService.get('INIT_PASSWORD'),
              ),
              role: adminRole?._id,
            },
            {
              name: 'User',
              email: 'user@gmail.com',
              password: this.userService.getHashPassword(
                this.configService.get('INIT_PASSWORD'),
              ),
              role: userRole?._id,
            },
          ]);
        }
      }
    } catch (err) {
      console.log(err);
    }
  }
}
