import { ForbiddenException } from '@nestjs/common';
import { AdminGuard } from '../auth/auth.guards';

const ctx = (user?: { id: string }) => ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;
const guard = (role: string | null) => new AdminGuard({ user: { findUnique: jest.fn().mockResolvedValue(role ? { role } : null) } } as any);

describe('AdminGuard', () => {
  it('permite ADMIN', async () => expect(await guard('ADMIN').canActivate(ctx({ id: 'u' }))).toBe(true));
  it('nega USER', async () => { await expect(guard('USER').canActivate(ctx({ id: 'u' }))).rejects.toThrow(ForbiddenException); });
  it('nega utilizador inexistente', async () => { await expect(guard(null).canActivate(ctx({ id: 'u' }))).rejects.toThrow(ForbiddenException); });
  it('nega pedido sem utilizador', async () => { await expect(guard('ADMIN').canActivate(ctx(undefined))).rejects.toThrow(ForbiddenException); });
});
