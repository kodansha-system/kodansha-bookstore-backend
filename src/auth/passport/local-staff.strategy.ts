import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStaffStrategy extends PassportStrategy(
  Strategy,
  'local-staff',
) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<any> {
    const staff = await this.authService.validateStaff(email, password);
    if (!staff) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return staff;
  }
}
