import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { AdminGuard, JwtAuthGuard } from '../auth/auth.guards';
import { pageMeta, parsePage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

/** Visão global da plataforma. Só ADMIN. Nunca expõe passwordHash. */
@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('overview')
  async overview() {
    const p = this.prisma;
    const since = new Date(Date.now() - 7 * 86_400_000);
    const [users, admins, newUsers7d, workspaces, projects, components, entriesByStatus, media, recentUsers, topProjects, signups] = await Promise.all([
      p.user.count(),
      p.user.count({ where: { role: 'ADMIN' } }),
      p.user.count({ where: { createdAt: { gte: since } } }),
      p.workspace.count(),
      p.project.count(),
      p.component.count(),
      p.contentEntry.groupBy({ by: ['status'], _count: { _all: true } }),
      p.mediaAsset.aggregate({ _count: { _all: true }, _sum: { size: true } }),
      p.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      p.$queryRaw<{ id: string; name: string; slug: string; entries: bigint }[]>`
        SELECT p.id, p.name, p.slug, COUNT(e.id) AS entries
        FROM "Project" p
        LEFT JOIN "Component" c ON c."projectId" = p.id
        LEFT JOIN "ContentEntry" e ON e."componentId" = c.id
        GROUP BY p.id ORDER BY entries DESC, p."createdAt" DESC LIMIT 5`,
      p.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
        FROM "User" WHERE "createdAt" >= now() - interval '30 days'
        GROUP BY 1 ORDER BY 1`,
    ]);
    const by = (s: string) => entriesByStatus.find((x) => x.status === s)?._count._all ?? 0;
    const entries = { draft: by('DRAFT'), published: by('PUBLISHED'), archived: by('ARCHIVED') };
    return {
      totals: {
        users, admins, newUsers7d, workspaces, projects, components,
        entries: entries.draft + entries.published + entries.archived,
        media: media._count._all, mediaBytes: media._sum.size ?? 0,
      },
      entries,
      recentUsers,
      topProjects: topProjects.map((x) => ({ ...x, entries: Number(x.entries) })),
      signupsLast30d: signups.map((x) => ({ day: x.day.toISOString().slice(0, 10), count: Number(x.count) })),
    };
  }

  @Get('users')
  async users(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    const pg = parsePage(page, limit);
    const term = q?.trim();
    const where: Prisma.UserWhereInput = term
      ? { OR: [{ email: { contains: term, mode: 'insensitive' } }, { name: { contains: term, mode: 'insensitive' } }] }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: pg.skip, take: pg.take,
        select: { id: true, name: true, email: true, role: true, googleId: true, createdAt: true, _count: { select: { workspaces: true } } },
      }),
    ]);
    return {
      data: data.map(({ googleId, ...u }) => ({ ...u, google: !!googleId })),
      meta: pageMeta(total, pg.page, pg.limit),
    };
  }

  @Get('projects')
  async projects(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    const pg = parsePage(page, limit);
    const term = q?.trim();
    const where: Prisma.ProjectWhereInput = term
      ? { OR: [{ name: { contains: term, mode: 'insensitive' } }, { slug: { contains: term, mode: 'insensitive' } }] }
      : {};
    const [total, data] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: pg.skip, take: pg.take,
        select: {
          id: true, name: true, slug: true, createdAt: true,
          workspace: { select: { owner: { select: { email: true } } } },
          _count: { select: { components: true, media: true } },
        },
      }),
    ]);
    return {
      data: data.map(({ workspace, ...x }) => ({ ...x, owner: workspace.owner.email })),
      meta: pageMeta(total, pg.page, pg.limit),
    };
  }
}
