import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { LocalAuthGuard, LocalAuthStaffGuard } from './local-auth.guard';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { UserLoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';
import { I18nService } from 'nestjs-i18n';
import { StaffsService } from 'src/staffs/staffs.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private roleService: RolesService,
    private usersService: UsersService,
    private staffsService: StaffsService,
    private readonly i18n: I18nService,
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

  @Public()
  @Post('login-staff')
  @UseGuards(LocalAuthStaffGuard)
  @ApiBody({ type: UserLoginDto })
  async loginStaff(@Request() req, @Res({ passthrough: true }) res) {
    return this.authService.loginStaff(req.user, res);
  }

  @Get('/profile')
  async getProfile(@Request() req) {
    const infor = await this.usersService.getUserInfor(req?.user?._id);
    return { ...req.user, ...infor };
  }

  @Get('/staff-profile')
  async getStaffProfile(@Request() req) {
    const infor: any = await this.staffsService.findOne(req?.user?._id);
    return infor?._doc;
  }

  @ResponseMessage('Register a user')
  @Public()
  @Post('/register')
  async register(@Body() body: RegisterUserDto) {
    return this.authService.registerWithUsernameAndPassword(body);
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

  @Public()
  @Get('/facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookLogin(
    @Req() req,
    @Res({ passthrough: true }) res,
  ): Promise<any> {
    const redirectUri = req.query.redirect_uri || '/';

    res.cookie('redirect_uri', redirectUri, { httpOnly: true, maxAge: 60000 });

    return HttpStatus.OK;
  }

  @Public()
  @Get('/facebook/redirect')
  @UseGuards(AuthGuard('facebook'))
  async facebookLoginRedirect(
    @Req() req: any,
    @Res({ passthrough: true }) response,
  ): Promise<any> {
    return this.authService.registerWithFacebook(req.user, response);
  }

  @Public()
  @Post('google-login')
  async googleLogin(
    @Body('token') token: string,
    @Res({ passthrough: true }) response,
  ) {
    const userData = await this.authService.verifyGoogleToken(token);
    return await this.authService.registerGoogleUser(userData, response);
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    const user = await this.usersService.findOneByUsername(email);
    if (!user) throw new BadRequestException('Email không tồn tại');

    await this.authService.sendNewPassword(email);
    return { message: 'Mật khẩu mới đã được gửi vào email của bạn' };
  }
}
