import { backupBeforeMigrate, hasPending } from './predeploy';

describe('hasPending', () => {
  it('deteta pendentes', () => expect(hasPending('Following migration have not yet been applied:\n20261106_x')).toBe(true));
  it('BD atualizada', () => expect(hasPending('Database schema is up to date!')).toBe(false));
});

describe('backupBeforeMigrate', () => {
  const env = (o: any = {}) => ({ BACKUP_URL: 'http://backup:8081', BACKUP_TOKEN: 't'.repeat(20), ...o }) as NodeJS.ProcessEnv;
  const res = (status: number, body: any) => ({ status, ok: status < 400, json: async () => body, text: async () => JSON.stringify(body) }) as any;
  beforeEach(() => { jest.spyOn(console, 'log').mockImplementation(); jest.spyOn(console, 'warn').mockImplementation(); });

  it('chama o serviço com token, wait=1 e trigger pre-migrate', async () => {
    const f = jest.fn().mockResolvedValue(res(200, { id: 'X' }));
    await backupBeforeMigrate(env(), f as any);
    expect(f.mock.calls[0][0]).toContain('/run?wait=1&trigger=pre-migrate');
    expect(f.mock.calls[0][1].headers.Authorization).toBe(`Bearer ${'t'.repeat(20)}`);
  });
  it('falha do backup ABORTA o deploy', async () => {
    const f = jest.fn().mockResolvedValue(res(500, { message: 'disco cheio' }));
    await expect(backupBeforeMigrate(env(), f as any)).rejects.toThrow(/500/);
  });
  it('skip não chama nada', async () => {
    const f = jest.fn();
    await backupBeforeMigrate(env({ PREDEPLOY_BACKUP: 'skip' }), f as any);
    expect(f).not.toHaveBeenCalled();
  });
  it('sem serviço: auto continua, required falha', async () => {
    await expect(backupBeforeMigrate({} as any, jest.fn() as any)).resolves.toBeUndefined();
    await expect(backupBeforeMigrate({ PREDEPLOY_BACKUP: 'required' } as any, jest.fn() as any)).rejects.toThrow(/required/);
  });
});
