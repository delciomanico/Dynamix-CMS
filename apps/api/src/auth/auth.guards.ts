import { ExecutionContext, Injectable, NotFoundException, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleGuard extends AuthGuard('google') {
  canActivate(ctx: ExecutionContext) {
    if (!process.env.GOOGLE_CLIENT_ID) throw new NotFoundException('Login com Google não configurado');
    return super.canActivate(ctx);
  }
}

export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as { id: string; email: string });
