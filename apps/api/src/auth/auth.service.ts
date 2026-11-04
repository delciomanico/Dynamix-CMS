import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  private publicUser(u: { id: string; email: string; name: string }) {
    return { id: u.id, email: u.email, name: u.name };
  }

  async register(name: string, email: string, password: string) {
    email = email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Email já registado');
    const user = await this.prisma.user.create({
      data: {
        name, email,
        passwordHash: await bcrypt.hash(password, 12),
        workspaces: { create: { name: `${name} — Workspace` } },
      },
    });
    return { token: this.sign(user), user: this.publicUser(user) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return { token: this.sign(user), user: this.publicUser(user) };
  }

  async googleLogin(profile: { googleId: string; email: string; name: string }) {
    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email.toLowerCase() }] },
    });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          name: profile.name, email: profile.email.toLowerCase(), googleId: profile.googleId,
          workspaces: { create: { name: `${profile.name} — Workspace` } },
        },
      });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: profile.googleId } });
    }
    return this.sign(user);
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.publicUser(u);
  }
}
