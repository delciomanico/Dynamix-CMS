import { BadRequestException } from '@nestjs/common';
import { MediaController } from './media.controller';

function setup() {
  const prisma: any = {
    mediaAsset: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([{ id: 'm1' }]), create: jest.fn((a) => a.data) },
  };
  const access: any = { project: jest.fn().mockResolvedValue({}) };
  const storage: any = { put: jest.fn() };
  return { prisma, access, storage, ctrl: new MediaController(prisma, access, storage) };
}
const file = (mimetype: string, name = 'a.PNG') => ({ mimetype, originalname: name, buffer: Buffer.from('x'), size: 1 }) as any;

describe('MediaController', () => {
  it('lista paginada', async () => {
    const { prisma, ctrl } = setup();
    const res = await ctrl.list({ id: 'u' }, 'p1', '2', '2');
    expect(prisma.mediaAsset.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 2, take: 2, where: { projectId: 'p1' } }));
    expect(res.meta).toEqual({ total: 3, page: 2, limit: 2, pages: 2 });
  });
  it('upload sem ficheiro falha', async () => {
    await expect(setup().ctrl.upload({ id: 'u' }, 'p1', undefined)).rejects.toThrow(BadRequestException);
  });
  it('upload com tipo não permitido falha', async () => {
    const { ctrl, storage } = setup();
    await expect(ctrl.upload({ id: 'u' }, 'p1', file('application/x-msdownload'))).rejects.toThrow(/Tipo não permitido/);
    expect(storage.put).not.toHaveBeenCalled();
  });
  it('upload válido guarda com chave isolada por projeto', async () => {
    const { ctrl, storage } = setup();
    const r: any = await ctrl.upload({ id: 'u' }, 'p1', file('image/png'));
    expect(storage.put).toHaveBeenCalledWith(expect.stringMatching(/^p1\/[0-9a-f-]{36}\.png$/), expect.any(Buffer), 'image/png');
    expect(r.projectId).toBe('p1');
  });
});
