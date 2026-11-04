import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(user: { id: string; email: string }) {
    return this.jwt.sign({ sub: user.id, email: user.email });
  }

  private publicUser(u: { id: string; email: string; name: string; role: string }) {
    return { id: u.id, email: u.email, name: u.name, role: u.role };
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

  /** Altera a password e devolve um token novo; os tokens anteriores deixam de ser aceites (ver JwtStrategy). */
  async changePassword(userId: string, current: string, next: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) throw new BadRequestException('Esta conta usa login Google e não tem password');
    // 400 (não 401): o frontend trata 401 como sessão expirada
    if (!(await bcrypt.compare(current, user.passwordHash))) throw new BadRequestException('Password atual incorreta');
    if (current === next) throw new BadRequestException('A nova password tem de ser diferente da atual');
    if (user.role === 'ADMIN' && next.length < 12) throw new BadRequestException('Administradores precisam de uma password com pelo menos 12 caracteres');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(next, 12), passwordChangedAt: new Date() },
    });
    return { token: this.sign(updated), user: this.publicUser(updated) };
  }

  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.publicUser(u);
  }
}
