import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccType, IUserBody } from 'src/users/users.interface';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private roleService: RolesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: IUserBody) {
    const { _id, email, name, role, facebook_id } = payload;
    const temp = await this.roleService.findOne(role?._id);
    return {
      _id,
      email,
      name,
      role,
      permissions: temp?.permissions || [],
      type: AccType.NORMAL,
      facebook_id,
    };
  }
}
