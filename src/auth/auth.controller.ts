import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { UserLoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private roleService: RolesService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @UseGuards(ThrottlerGuard)
  @ApiBody({ type: UserLoginDto })
  @ApiOkResponse({ description: 'result Token' })
  @Post('/login')
  async login(@Request() req, @Res({ passthrough: true }) response) {
    return this.authService.login(req.user, response);
  }

  @Get('/profile')
  async getProfile(@Request() req) {
    const temp = await this.roleService.findOne(req?.user?.role?._id);
    return { ...req.user, permissions: temp?.permissions };
  }

  @ResponseMessage('Register a user')
  @Public()
  @Post('/register')
  async register(@Body() body: RegisterUserDto) {
    return this.authService.register(body);
  }

  @Public()
  @ResponseMessage('Get refresh token')
  @Get('/refresh')
  getRefreshToken(@Request() req, @Res({ passthrough: true }) response) {
    const refresh_token = req.cookies['refresh_token'];

    return this.authService.processNewToken(refresh_token, response);
  }

  @ResponseMessage('Logout successfully')
  @Post('/logout')
  async logout(@Request() req, @Res({ passthrough: true }) response) {
    return this.authService.logout(req.user, response);
  }
}
