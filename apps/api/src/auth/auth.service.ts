import { BadRequestException, ConflictException, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, @Optional() private storage?: StorageService) {}

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

  /** Perfil completo da conta (sem dados sensíveis): tipo de login, data de criação e contagens. */
  async me(userId: string) {
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const [websites, blogs] = await Promise.all([
      this.prisma.project.count({ where: { workspace: { ownerId: userId }, kind: 'SITE' } }),
      this.prisma.project.count({ where: { workspace: { ownerId: userId }, kind: 'BLOG' } }),
    ]);
    return { ...this.publicUser(u), createdAt: u.createdAt, hasPassword: !!u.passwordHash, google: !!u.googleId, websites, blogs };
  }

  /** Atualiza o nome de apresentação. */
  async updateProfile(userId: string, name: string) {
    const clean = name.trim().replace(/\s+/g, ' ');
    if (clean.length < 2) throw new BadRequestException('O nome precisa de pelo menos 2 caracteres');
    await this.prisma.user.update({ where: { id: userId }, data: { name: clean.slice(0, 80) } });
    return this.me(userId);
  }

  /** Confirma a identidade: password (contas com password) ou, em contas só-Google, o email atual escrito. */
  private async confirm(user: { passwordHash: string | null; email: string }, proof: string) {
    if (user.passwordHash) {
      // 400 (não 401): o frontend trata 401 como sessão expirada
      if (!proof || !(await bcrypt.compare(proof, user.passwordHash))) throw new BadRequestException('Password incorreta');
    } else if ((proof ?? '').trim().toLowerCase() !== user.email.toLowerCase()) {
      throw new BadRequestException('Escreve o teu email atual para confirmar');
    }
  }

  /** Altera o email (exige confirmação). Termina as outras sessões e devolve um token novo. Contas Google mantêm o email do Google. */
  async changeEmail(userId: string, newEmail: string, proof: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.googleId && !user.passwordHash) throw new BadRequestException('Esta conta usa login Google: o email é o da conta Google');
    await this.confirm(user, proof);
    const email = newEmail.trim().toLowerCase();
    if (email === user.email) throw new BadRequestException('O novo email é igual ao atual');
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('Email já registado');
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { email, passwordChangedAt: new Date() } });
    return { token: this.sign(updated), user: this.publicUser(updated) };
  }

  /** Termina todas as outras sessões (os tokens anteriores deixam de ser aceites) e devolve um token novo para esta. */
  async logoutOthers(userId: string) {
    const updated = await this.prisma.user.update({ where: { id: userId }, data: { passwordChangedAt: new Date() } });
    return { token: this.sign(updated), user: this.publicUser(updated) };
  }

  /** Apaga a conta e todos os seus dados (workspaces, projetos, conteúdos e ficheiros). O último administrador não pode ser apagado. */
  async deleteAccount(userId: string, proof: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await this.confirm(user, proof);
    if (user.role === 'ADMIN' && (await this.prisma.user.count({ where: { role: 'ADMIN' } })) <= 1) {
      throw new BadRequestException('Não podes apagar o único administrador da plataforma');
    }
    const media = await this.prisma.mediaAsset.findMany({ where: { project: { workspace: { ownerId: userId } } }, select: { key: true } });
    await this.prisma.user.delete({ where: { id: userId } }); // cascata: workspaces → projetos → componentes/conteúdos/media
    // Ficheiros no armazenamento (melhor esforço: a conta já foi apagada)
    await Promise.allSettled(media.map((m) => this.storage?.remove(m.key)));
    return { ok: true };
  }
}
