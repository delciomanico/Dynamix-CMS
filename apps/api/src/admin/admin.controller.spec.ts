import { AdminController } from './admin.controller';

function setup() {
  const prisma: any = {
    user: {
      count: jest.fn().mockResolvedValue(3),
      findMany: jest.fn().mockResolvedValue([{ id: 'u1', name: 'A', email: 'a@a.pt', role: 'USER', googleId: 'g', createdAt: new Date(), _count: { workspaces: 1 } }]),
    },
    workspace: { count: jest.fn().mockResolvedValue(3) },
    project: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: 'P', slug: 'p', createdAt: new Date(), workspace: { owner: { email: 'a@a.pt' } }, _count: { components: 1, media: 0 } }]) },
    component: { count: jest.fn().mockResolvedValue(4) },
    contentEntry: { groupBy: jest.fn().mockResolvedValue([{ status: 'PUBLISHED', _count: { _all: 5 } }, { status: 'DRAFT', _count: { _all: 2 } }]) },
    mediaAsset: { aggregate: jest.fn().mockResolvedValue({ _count: { _all: 6 }, _sum: { size: 1234 } }) },
    $queryRaw: jest.fn().mockResolvedValueOnce([{ id: 'p1', name: 'P', slug: 'p', entries: 7n }]).mockResolvedValueOnce([{ day: new Date('2026-11-01T00:00:00Z'), count: 2n }]),
  };
  return { prisma, ctrl: new AdminController(prisma) };
}

describe('AdminController', () => {
  it('overview agrega totais e converte bigint', async () => {
    const { ctrl } = setup();
    const r = await ctrl.overview();
    expect(r.totals).toMatchObject({ users: 3, projects: 2, components: 4, entries: 7, media: 6, mediaBytes: 1234 });
    expect(r.entries).toEqual({ draft: 2, published: 5, archived: 0 });
    expect(r.topProjects[0].entries).toBe(7);
    expect(r.signupsLast30d).toEqual([{ day: '2026-11-01', count: 2 }]);
    expect(JSON.stringify(r)).not.toContain('passwordHash');
  });
  it('users: paginado, pesquisa e não expõe googleId/passwordHash', async () => {
    const { prisma, ctrl } = setup();
    const r = await ctrl.users('2', '10', ' ana ');
    const args = prisma.user.findMany.mock.calls[0][0];
    expect(args).toMatchObject({ skip: 10, take: 10 });
    expect(args.where.OR).toHaveLength(2);
    expect(args.select.passwordHash).toBeUndefined();
    expect(r.data[0]).toMatchObject({ email: 'a@a.pt', google: true });
    expect(r.data[0]).not.toHaveProperty('googleId');
    expect(r.meta).toEqual({ total: 3, page: 2, limit: 10, pages: 1 });
  });
  it('projects: devolve dono', async () => {
    const { ctrl } = setup();
    const r = await ctrl.projects();
    expect(r.data[0].owner).toBe('a@a.pt');
  });
});
