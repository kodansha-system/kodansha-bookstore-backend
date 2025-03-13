import { firebaseAdmin } from '../config/firebase.config';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AccType, IUserFacebook } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';
import { RolesService } from 'src/roles/roles.service';
import { getHashPassword } from 'src/utils';
import { USER_ROLE } from 'src/databases/sample';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { I18nService } from 'nestjs-i18n';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailService: MailerService,
    private i18n: I18nService,

    @InjectModel(Role.name)
    private roleModel: SoftDeleteModel<RoleDocument>,

    @InjectModel(User.name)
    private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = (await this.usersService.findOneByUsername(username)) as any;
    if (user) {
      const isValid = this.usersService.isValidPassword(
        pass,
        user.toObject().password,
      );
      if (isValid) {
        const temp = await this.rolesService.findOne(user?.role?._id);
        const { password, ...result } = user;
        return { ...result, permissions: temp?.permissions };
      }
    }
    return null;
  }

  async login(user: any, response: Response) {
    try {
      const { _id, email, name, role, permissions, type } = user;

      const payload = {
        iss: 'from server',
        sub: 'token login',
        _id,
        email,
        name,
        role,
        type,
      };

      const refresh_token = this.createRefreshToken(payload);

      await this.usersService.updateUserToken(refresh_token, _id);

      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRED')),
        sameSite: 'lax',
        secure: false,
      });

      return {
        access_token: this.jwtService.sign(payload),
        user: {
          _id,
          email,
          name,
          role,
          permissions,
          type,
        },
      };
    } catch (error) {
      console.log(error);
    }
  }

  async registerWithUsernameAndPassword(createUserDto: RegisterUserDto) {
    const { password, email } = createUserDto;

    const isExisted = await this.userModel.findOne({ email });

    if (isExisted) {
      throw new BadRequestException('Email is existed');
    }

    const defaultRole = await this.roleModel.findOne({ name: USER_ROLE });

    const hashPassword = getHashPassword(password);

    const user = await this.userModel.create({
      ...createUserDto,
      username: `user${crypto.randomUUID().substring(0, 8)}`,
      password: hashPassword,
      role: defaultRole?._id,
      type: AccType.NORMAL,
    });

    const response = user.toObject();

    delete response.password;

    return response;
  }

  async registerWithFacebook(data: IUserFacebook, response) {
    const { id, name, image } = data;

    const defaultRole = await this.roleModel.findOne({ name: USER_ROLE });

    const createTokenAndRefreshToken = async (
      facebookId: string,
      userRole: any,
    ) => {
      const refresh_token = this.createRefreshToken({
        facebook_id: facebookId,
        role: userRole?._id,
        type: AccType.FACEBOOK,
      });

      response.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRED')),
      });

      return {
        access_token: this.jwtService.sign({
          facebook_id: facebookId,
          role: userRole?._id,
          type: AccType.FACEBOOK,
        }),
        refresh_token,
        user: { facebook_id: facebookId, name, role: userRole?._id, image },
      };
    };

    const userFacebook = await this.userModel.findOne({ facebook_id: id });

    if (userFacebook) {
      const updatedName = userFacebook.name || name;

      await this.userModel.updateOne(
        { facebook_id: id },
        { name: updatedName, image },
      );

      return await createTokenAndRefreshToken(id, userFacebook.role);
    }

    await this.userModel.create({
      facebook_id: id,
      name,
      username: `user${crypto.randomUUID().substring(0, 8)}`,
      image,
      role: defaultRole?._id,
      type: AccType.FACEBOOK,
    });

    return await createTokenAndRefreshToken(id, defaultRole);
  }

  createRefreshToken = (payload) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRED')),
    });
    return refresh_token;
  };

  processNewToken = async (refresh_token: string, response: Response) => {
    try {
      this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });

      const user: any = await this.usersService.findUserByToken(refresh_token);

      if (user) {
        this.usersService.updateUserToken(refresh_token, user?._id);
        response.clearCookie('refresh_token');
        response.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRED')),
        });
        const { _id, email, name, role, permissions } = user;

        const payload = {
          iss: 'from server',
          sub: 'token login',
          _id,
          email,
          name,
          role,
        };

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            email,
            name,
            role,
            permissions,
          },
        };
      } else {
        throw new BadRequestException('Token hết hạn');
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Token hết hạn');
    }
  };

  logout = async (user, response) => {
    const userLogout = await this.usersService.findOne(user._id);
    if (userLogout) {
      response.clearCookie('refresh_token');
      await this.usersService.updateUserToken('', user?._id);
    }
  };

  async verifyGoogleToken(token: string) {
    try {
      const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;
      const user = await firebaseAdmin.auth().getUser(uid);
      return user.providerData;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  registerGoogleUser = async (data, response) => {
    try {
      const defaultRole = await this.roleModel.findOne({ name: USER_ROLE });
      const { displayName, email, photoURL } = data[0];
      const user = await this.userModel.findOne({ email });

      if (user) {
        return await this.login(user.toObject(), response);
      }

      const userData = await this.userModel.create({
        email,
        name: displayName,
        username: `user${crypto.randomUUID().substring(0, 8)}`,
        image: photoURL,
        role: defaultRole?._id,
        type: AccType.GOOGLE,
      });

      return await this.login(userData.toObject(), response);
    } catch (err) {
      console.log(err);
    }
  };

  sendNewPassword = async (email: string) => {
    const user = await this.usersService.findOneByUsername(email);
    if (!user) throw new BadRequestException('Email không tồn tại');

    const new_password = crypto.randomUUID().substring(0, 8);
    const hash_password = getHashPassword(new_password);

    await this.usersService.updatePassword(email, hash_password);

    await this.mailService.sendMail({
      to: email,
      from: '"IT VIP pro" <abc@gmail.com>',
      subject: 'Đặt lại mật khẩu của bạn!',
      template: 'reset-password',
      context: {
        receiver: 'Lương Minh Anh',
        new_password,
        reset_link: '#',
      },
    });
  };
}
