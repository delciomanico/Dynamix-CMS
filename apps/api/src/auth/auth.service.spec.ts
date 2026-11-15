import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { UnauthorizedException } from '@nestjs/common';

async function setup(role = 'USER', hash: string | null = null) {
  const passwordHash = hash === null ? await bcrypt.hash('atual-password-1', 4) : hash || null;
  const user = { id: 'u1', email: 'a@a.pt', name: 'A', role, passwordHash };
  const prisma: any = {
    user: {
      findUniqueOrThrow: jest.fn().mockResolvedValue(user),
      update: jest.fn(async ({ data }) => ({ ...user, ...data })),
    },
  };
  const jwt: any = { sign: jest.fn().mockReturnValue('novo-token') };
  return { prisma, svc: new AuthService(prisma, jwt) };
}

describe('AuthService.changePassword', () => {
  it('altera, grava hash novo + passwordChangedAt e devolve token novo', async () => {
    const { prisma, svc } = await setup();
    const r = await svc.changePassword('u1', 'atual-password-1', 'nova-password-9');
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(await bcrypt.compare('nova-password-9', data.passwordHash)).toBe(true);
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(r.token).toBe('novo-token');
  });
  it('rejeita password atual errada (400, não 401)', async () => {
    const { prisma, svc } = await setup();
    await expect(svc.changePassword('u1', 'errada', 'nova-password-9')).rejects.toThrow(BadRequestException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
  it('rejeita igual à atual', async () => {
    const { svc } = await setup();
    await expect(svc.changePassword('u1', 'atual-password-1', 'atual-password-1')).rejects.toThrow(/diferente/);
  });
  it('admin exige >= 12 caracteres', async () => {
    const { svc } = await setup('ADMIN');
    await expect(svc.changePassword('u1', 'atual-password-1', 'curta-123')).rejects.toThrow(/12 caracteres/);
  });
  it('conta Google (sem password) não pode', async () => {
    const { svc } = await setup('USER', '');
    await expect(svc.changePassword('u1', 'x', 'nova-password-9')).rejects.toThrow(/Google/);
  });
});

describe('JwtStrategy.validate', () => {
  const mk = (row: any) => new JwtStrategy({ getOrThrow: () => 's' } as any, { user: { findUnique: jest.fn().mockResolvedValue(row) } } as any);
  it('aceita token válido', async () => {
    expect(await mk({ passwordChangedAt: null }).validate({ sub: 'u1', email: 'e', iat: 100 })).toEqual({ id: 'u1', email: 'e' });
  });
  it('rejeita utilizador apagado', async () => {
    await expect(mk(null).validate({ sub: 'u1', email: 'e', iat: 100 })).rejects.toThrow(UnauthorizedException);
  });
  it('rejeita token anterior à mudança de password', async () => {
    const changed = new Date(2_000_000 * 1000);
    await expect(mk({ passwordChangedAt: changed }).validate({ sub: 'u1', email: 'e', iat: 1_999_999 })).rejects.toThrow(/password foi alterada/);
  });
  it('aceita token emitido no mesmo segundo da mudança', async () => {
    const changed = new Date(2_000_000 * 1000 + 500);
    await expect(mk({ passwordChangedAt: changed }).validate({ sub: 'u1', email: 'e', iat: 2_000_000 })).resolves.toBeTruthy();
  });
});

describe('perfil da conta', () => {
  async function acct(over: Record<string, any> = {}, existing: any = null, admins = 2) {
    const passwordHash = 'passwordHash' in over ? over.passwordHash : await bcrypt.hash('atual-password-1', 4);
    const user = { id: 'u1', email: 'a@a.pt', name: 'A', role: 'USER', googleId: null, createdAt: new Date(0), ...over, passwordHash };
    const prisma: any = {
      user: {
        findUniqueOrThrow: jest.fn().mockResolvedValue(user),
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn(async ({ data }: any) => ({ ...user, ...data })),
        delete: jest.fn().mockResolvedValue({}),
        count: jest.fn().mockResolvedValue(admins),
      },
      project: { count: jest.fn().mockResolvedValue(1) },
      mediaAsset: { findMany: jest.fn().mockResolvedValue([{ key: 'k1' }, { key: 'k2' }]) },
    };
    const storage: any = { remove: jest.fn().mockResolvedValue(undefined) };
    return { prisma, storage, svc: new AuthService(prisma, { sign: jest.fn().mockReturnValue('tok') } as any, storage) };
  }

  it('me() devolve tipo de login e contagens, sem o hash', async () => {
    const { svc } = await acct();
    const me = await svc.me('u1') as any;
    expect(me).toMatchObject({ hasPassword: true, google: false, websites: 1, blogs: 1 });
    expect(me.passwordHash).toBeUndefined();
  });

  it('updateProfile limpa espaços e rejeita nomes curtos', async () => {
    const { prisma, svc } = await acct();
    await svc.updateProfile('u1', '  Maria   Silva ');
    expect(prisma.user.update.mock.calls[0][0].data.name).toBe('Maria Silva');
    await expect(svc.updateProfile('u1', ' a ')).rejects.toThrow(BadRequestException);
  });

  it('changeEmail: confirma password, normaliza, termina outras sessões e devolve token', async () => {
    const { prisma, svc } = await acct();
    const r = await svc.changeEmail('u1', ' Novo@Mail.PT ', 'atual-password-1');
    const data = prisma.user.update.mock.calls[0][0].data;
    expect(data.email).toBe('novo@mail.pt');
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(r.token).toBe('tok');
  });
  it('changeEmail: password errada, email repetido ou em uso → erro e nada gravado', async () => {
    let c = await acct();
    await expect(c.svc.changeEmail('u1', 'x@x.pt', 'errada')).rejects.toThrow(/Password incorreta/);
    await expect(c.svc.changeEmail('u1', 'A@a.pt', 'atual-password-1')).rejects.toThrow(/igual/);
    c = await acct({}, { id: 'u2' });
    await expect(c.svc.changeEmail('u1', 'x@x.pt', 'atual-password-1')).rejects.toThrow(ConflictException);
    expect(c.prisma.user.update).not.toHaveBeenCalled();
  });
  it('changeEmail: conta só-Google não pode', async () => {
    const { svc } = await acct({ passwordHash: null, googleId: 'g1' });
    await expect(svc.changeEmail('u1', 'x@x.pt', 'a@a.pt')).rejects.toThrow(/Google/);
  });

  it('logoutOthers invalida tokens anteriores', async () => {
    const { prisma, svc } = await acct();
    await svc.logoutOthers('u1');
    expect(prisma.user.update.mock.calls[0][0].data.passwordChangedAt).toBeInstanceOf(Date);
  });

  it('deleteAccount: confirma, apaga a conta e os ficheiros', async () => {
    const { prisma, storage, svc } = await acct();
    await expect(svc.deleteAccount('u1', 'errada')).rejects.toThrow(/Password incorreta/);
    expect(prisma.user.delete).not.toHaveBeenCalled();
    await svc.deleteAccount('u1', 'atual-password-1');
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    expect(storage.remove).toHaveBeenCalledTimes(2);
  });
  it('deleteAccount: conta só-Google confirma com o email; único admin não pode', async () => {
    const g = await acct({ passwordHash: null, googleId: 'g1' });
    await expect(g.svc.deleteAccount('u1', 'outro@x.pt')).rejects.toThrow(/email/);
    await g.svc.deleteAccount('u1', 'A@a.pt');
    expect(g.prisma.user.delete).toHaveBeenCalled();
    const a = await acct({ role: 'ADMIN' }, null, 1);
    await expect(a.svc.deleteAccount('u1', 'atual-password-1')).rejects.toThrow(/único administrador/);
    expect(a.prisma.user.delete).not.toHaveBeenCalled();
  });
});
