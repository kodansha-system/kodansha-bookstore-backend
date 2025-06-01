import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
export const ResponseMessage = (message: string) =>
  SetMetadata('response_message', message);
export const IS_SKIP_CHECK_PERMISSION = 'isSkipCheckPermission';
export const SkipCheckPermission = () =>
  SetMetadata(IS_SKIP_CHECK_PERMISSION, true);
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
