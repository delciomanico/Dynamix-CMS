import { BadRequestException } from '@nestjs/common';
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
