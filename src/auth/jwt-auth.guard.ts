import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import {
  IS_PUBLIC_KEY,
  IS_SKIP_CHECK_PERMISSION,
} from 'src/decorator/customize';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    try {
      // const skipCheckPermission = this.reflector.getAllAndOverride<boolean>(
      //   IS_SKIP_CHECK_PERMISSION,
      //   [context.getHandler(), context.getClass()],
      // );
      // if (skipCheckPermission) {
      //   return user;
      // }
      // const request = context.switchToHttp().getRequest();
      // const currPath = request?.route?.path;
      // const currMethod = request?.method;

      // let hasPermission = user?.permissions?.find(({ api_path, method }) => {
      //   return api_path === currPath && method === currMethod;
      // });

      // const authRegex = /^\/api\/v1\/auth(\/|$)/;

      // if (authRegex.test(currPath)) {
      //   hasPermission = true;
      // }

      // if (!hasPermission) {
      //   throw err || new UnauthorizedException('Không có quyền vào route này');
      // }

      if (err || !user) {
        throw err || new UnauthorizedException('Token không hợp lệ');
      }

      return user;
    } catch (err) {
      console.log(err);
      throw err || new UnauthorizedException('Không có quyền vào route này');
    }
  }
}
