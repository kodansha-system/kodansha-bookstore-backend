import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
@Injectable()
export class LocalAuthStaffGuard extends AuthGuard('local-staff') {}
@Injectable()
export class LocalAuthAdminGuard extends AuthGuard('local-admin') {}
