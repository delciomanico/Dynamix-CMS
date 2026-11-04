import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException, createParamDecorator } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleGuard extends AuthGuard('google') {
  canActivate(ctx: ExecutionContext) {
    if (!process.env.GOOGLE_CLIENT_ID) throw new NotFoundException('Login com Google não configurado');
    return super.canActivate(ctx);
  }
}

export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user as { id: string; email: string });

/** Exige role ADMIN. Consulta a BD em cada pedido (não confia em claims do token), pelo que revogar o papel tem efeito imediato. Usar depois de JwtAuthGuard. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext) {
    const id = ctx.switchToHttp().getRequest().user?.id as string | undefined;
    const u = id ? await this.prisma.user.findUnique({ where: { id }, select: { role: true } }) : null;
    if (u?.role !== 'ADMIN') throw new ForbiddenException('Acesso reservado a administradores');
    return true;
  }
}
