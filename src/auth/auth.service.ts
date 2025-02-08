import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import ms from 'ms';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private rolesService: RolesService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = (await this.usersService.findOneByUsername(username)) as any;
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid) {
        const temp = await this.rolesService.findOne(user?.role?._id);
        const { password, ...result } = user;
        return { ...result, permissions: temp?.permissions };
      }
    }
    return null;
  }

  async login(user: any, response: Response) {
    const { _id, email, name, role, permissions } = user;

    const payload = {
      iss: 'from server',
      sub: 'token login',
      _id,
      email,
      name,
      role,
    };

    const refresh_token = this.createRefreshToken(payload);

    await this.usersService.updateUserToken(refresh_token, _id);

    response.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('REFRESH_TOKEN_EXPIRED')),
    });

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
  }

  async register(data: RegisterUserDto) {
    const res: any = await this.usersService.register(data);
    return {
      _id: res?._id,
      createdAt: res?.createdAt,
    };
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
}
