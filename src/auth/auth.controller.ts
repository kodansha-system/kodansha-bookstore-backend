import {
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
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { RolesService } from 'src/roles/roles.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { UserLoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from 'src/users/users.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private roleService: RolesService,
    private usersService: UsersService,
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
  async facebookLogin(@Req() req, @Res() res): Promise<any> {
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
}
