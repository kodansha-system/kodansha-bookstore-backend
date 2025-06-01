import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './passport/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './passport/jwt.strategy';
import ms from 'ms';
import { AuthController } from './auth.controller';
import { RolesModule } from 'src/roles/roles.module';
import { FacebookStrategy } from './passport/facebook.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from 'src/roles/schemas/role.schema';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { LocalStaffStrategy } from './passport/local-staff.strategy';
import { Staff, StaffSchema } from 'src/staffs/schemas/staff.schema';
import { StaffsModule } from 'src/staffs/staffs.module';
@Module({
  providers: [
    AuthService,
    LocalStrategy,
    LocalStaffStrategy,
    JwtStrategy,
    FacebookStrategy,
  ],
  imports: [
    UsersModule,
    StaffsModule,
    RolesModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRED'),
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: User.name, schema: UserSchema },
      { name: Staff.name, schema: StaffSchema },
    ]),
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
