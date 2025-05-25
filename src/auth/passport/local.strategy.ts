import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    console.log('lắm startegy vãi');
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new UnauthorizedException('Username/password is invalid');
    }
    console.log(user, 'user trong validate');
    return user;
  }
}
