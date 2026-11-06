import { NotFoundException } from '@nestjs/common';
import { ContentsController } from './contents.controller';

function setup() {
  const prisma: any = {
    $queryRaw: jest.fn().mockResolvedValue([{ id: 'e1' }, { id: 'e2' }]),
    contentEntry: { count: jest.fn().mockResolvedValue(45), findMany: jest.fn().mockResolvedValue([{ id: 'e1' }]) },
  };
  const access: any = { component: jest.fn().mockResolvedValue({ id: 'c1', fields: [] }) };
  return { prisma, access, ctrl: new ContentsController(prisma, access) };
}

describe('ContentsController.list (paginação)', () => {
  it('devolve { data, meta } com skip/take corretos', async () => {
    const { prisma, ctrl } = setup();
    const res = await ctrl.list({ id: 'u1' }, 'c1', undefined, '2', '20');
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 20, orderBy: { updatedAt: 'desc' } }));
    expect(res).toEqual({ data: [{ id: 'e1' }], meta: { total: 45, page: 2, limit: 20, pages: 3 } });
  });
  it('aplica limite máximo de 100', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list({ id: 'u1' }, 'c1', undefined, '1', '5000');
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
  });
  it('filtra por status válido e ignora inválido', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list({ id: 'u1' }, 'c1', 'PUBLISHED' as any);
    expect(prisma.contentEntry.count).toHaveBeenLastCalledWith({ where: { componentId: 'c1', status: 'PUBLISHED' } });
    await ctrl.list({ id: 'u1' }, 'c1', 'HACK' as any);
    expect(prisma.contentEntry.count).toHaveBeenLastCalledWith({ where: { componentId: 'c1' } });
  });
  it('verifica acesso do utilizador (isolamento)', async () => {
    const { prisma, access, ctrl } = setup();
    access.component.mockRejectedValue(new NotFoundException());
    await expect(ctrl.list({ id: 'outro' }, 'c1')).rejects.toThrow(NotFoundException);
    expect(prisma.contentEntry.findMany).not.toHaveBeenCalled();
  });
});

describe('ContentsController.list (pesquisa e secções)', () => {
  it('q/section resolvem ids por SQL e restringem o where', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list({ id: 'u1' }, 'c1', undefined, '1', '20', ' Contacto ', 'nav');
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(prisma.contentEntry.count).toHaveBeenLastCalledWith({ where: { componentId: 'c1', id: { in: ['e1', 'e2'] } } });
  });
  it('sem q/section não faz SQL extra', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list({ id: 'u1' }, 'c1');
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
  it('sort=slug ordena por slug', async () => {
    const { prisma, ctrl } = setup();
    await ctrl.list({ id: 'u1' }, 'c1', undefined, '1', '20', undefined, undefined, 'slug');
    expect(prisma.contentEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { slug: 'asc' } }));
  });
  it('sections devolve contagens numéricas', async () => {
    const { prisma, ctrl } = setup();
    prisma.$queryRaw.mockResolvedValue([{ section: 'nav', count: 3n }]);
    expect(await ctrl.sections({ id: 'u1' }, 'c1')).toEqual([{ section: 'nav', count: 3 }]);
  });
});
