import { NotFoundException } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';

function setup() {
  const prisma: any = {
    project: { findUnique: jest.fn().mockResolvedValue({ id: 'p1', slug: 'site' }) },
    component: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', fields: [{ key: 'title', type: 'text' }, { key: 'cover', type: 'image' }] }) },
    contentEntry: {
      count: jest.fn().mockResolvedValue(25),
      findMany: jest.fn().mockResolvedValue([{ id: 'e1', slug: 's', data: { title: 'T', cover: 'm9' }, publishedAt: null }]),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'e1' }]),
  };
  const cfg: any = { get: (_k: string, d: string) => d };
  return { prisma, ctrl: new PublicApiController(prisma, {} as any, cfg) };
}

describe('PublicApiController.list', () => {
  it('paginação por defeito (10) e meta', async () => {
    const { prisma, ctrl } = setup();
    const res = await ctrl.list('site', 'posts', {});
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0, take: 10 }));
    expect(res.meta).toEqual({ total: 25, page: 1, limit: 10, pages: 3 });
  });
  it('só devolve PUBLISHED', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list('site', 'posts', { page: '3', limit: '10' });
    expect(prisma.contentEntry.count).toHaveBeenCalledWith({ where: expect.objectContaining({ status: 'PUBLISHED', componentId: 'c1' }) });
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20 }));
  });
  it('converte ids de media em URLs', async () => {
    const { ctrl } = setup();
    const res = await ctrl.list('site', 'posts', {});
    expect((res.data[0] as any).cover).toBe('http://localhost:3001/api/v1/public/site/media/m9');
  });
  it('ordenação fora da lista branca usa publishedAt desc', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list('site', 'posts', { sort: 'data' });
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { publishedAt: 'desc' } }));
    await ctrl.list('site', 'posts', { sort: 'slug' });
    expect(prisma.contentEntry.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ orderBy: { slug: 'asc' } }));
  });
  it('filtros só para campos definidos no componente', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list('site', 'posts', { filter: { title: '5', inventado: 'x' } });
    const where = prisma.contentEntry.count.mock.calls[0][0].where;
    expect(where.AND).toEqual([{ data: { path: ['title'], equals: 5 } }]);
  });
  it('projeto inexistente → 404', async () => {
    const { prisma, ctrl } = setup();
    prisma.project.findUnique.mockResolvedValue(null);
    await expect(ctrl.list('x', 'posts', {})).rejects.toThrow(NotFoundException);
  });
  it('componente inexistente → 404', async () => {
    const { prisma, ctrl } = setup();
    prisma.component.findUnique.mockResolvedValue(null);
    await expect(ctrl.list('site', 'x', {})).rejects.toThrow(NotFoundException);
  });
});
