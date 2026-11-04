import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.getOrThrow('JWT_SECRET'),
    });
  }

  /** Rejeita tokens de utilizadores apagados ou emitidos antes da última mudança de password. */
  async validate(payload: { sub: string; email: string; iat?: number }) {
    const u = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { passwordChangedAt: true } });
    if (!u) throw new UnauthorizedException();
    if (u.passwordChangedAt && (payload.iat ?? 0) < Math.floor(u.passwordChangedAt.getTime() / 1000)) {
      throw new UnauthorizedException('Sessão terminada: a password foi alterada');
    }
    return { id: payload.sub, email: payload.email };
  }
}
