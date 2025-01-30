import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { CreateUserDto, RegisterUserDto } from 'src/users/dto/create-user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService
      .findOneByUsername(username)
      .select('password');
    if (user) {
      const isValid = this.usersService.isValidPassword(pass, user.password);
      if (isValid) {
        const { password, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: IUser) {
    const { _id, email, name, role } = user?._doc;
    const payload = {
      iss: 'from server',
      sub: 'token login',
      _id,
      email,
      name,
      role,
    };

    const refresh_token = this.createRefreshToken(payload);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id,
        email,
        name,
        role,
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
      expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRED'),
    });
    return refresh_token;
  };
}
