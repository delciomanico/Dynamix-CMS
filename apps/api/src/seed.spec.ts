import { seedAdmin } from './seed';

const mk = (existing: any = null) => ({
  user: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn(), update: jest.fn() },
}) as any;
const env = (o: Record<string, string> = {}) => ({ ADMIN_EMAIL: 'Admin@Site.PT', ADMIN_PASSWORD: 'uma-password-longa', ...o }) as NodeJS.ProcessEnv;

describe('seedAdmin', () => {
  it('ignora se faltam variáveis', async () => {
    const p = mk();
    expect(await seedAdmin(p, {} as any)).toBe('skipped');
    expect(p.user.create).not.toHaveBeenCalled();
  });
  it('rejeita password curta', async () => {
    await expect(seedAdmin(mk(), env({ ADMIN_PASSWORD: 'curta' }))).rejects.toThrow(/12 caracteres/);
  });
  it('cria ADMIN com email normalizado e password em hash', async () => {
    const p = mk();
    expect(await seedAdmin(p, env())).toBe('created');
    const d = p.user.create.mock.calls[0][0].data;
    expect(d).toMatchObject({ email: 'admin@site.pt', role: 'ADMIN' });
    expect(d.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(d.passwordHash).not.toContain('uma-password');
  });
  it('promove utilizador existente sem tocar na password', async () => {
    const p = mk({ id: 'u1', role: 'USER' });
    expect(await seedAdmin(p, env())).toBe('promoted');
    expect(p.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { role: 'ADMIN' } });
  });
  it('é idempotente se já é ADMIN', async () => {
    const p = mk({ id: 'u1', role: 'ADMIN' });
    expect(await seedAdmin(p, env())).toBe('unchanged');
    expect(p.user.update).not.toHaveBeenCalled();
    expect(p.user.create).not.toHaveBeenCalled();
  });
});
