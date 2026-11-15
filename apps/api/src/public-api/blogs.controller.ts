import { Controller, Get, Header, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BLOG_COMPONENT } from '../common/blog';
import { pageMeta, parsePage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';

/** Diretório público de blogs: os projetos do tipo BLOG com pelo menos um artigo publicado. */
@Throttle({ default: { limit: 3000, ttl: 60_000 } })
@ApiTags('public')
@Controller('blogs')
export class BlogsController {
  constructor(private prisma: PrismaService, private cfg: ConfigService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  async list(@Query('page') page?: string, @Query('limit') limit?: string, @Query('q') q?: string) {
    const { page: pg, limit: lim, skip, take } = parsePage(page, limit, 12);
    const term = (q ?? '').trim().slice(0, 100);
    const where = { kind: 'BLOG', ...(term ? { OR: [{ name: { contains: term, mode: 'insensitive' as const } }, { description: { contains: term, mode: 'insensitive' as const } }] } : {}), components: { some: { slug: BLOG_COMPONENT, entries: { some: { status: 'PUBLISHED' as const } } } } };
    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where, skip, take, orderBy: { updatedAt: 'desc' },
        select: {
          name: true, slug: true, description: true, theme: true,
          components: {
            where: { slug: BLOG_COMPONENT },
            select: {
              _count: { select: { entries: { where: { status: 'PUBLISHED' } } } },
              entries: { where: { status: 'PUBLISHED' }, orderBy: { publishedAt: 'desc' }, take: 1, select: { data: true, publishedAt: true } },
            },
          },
        },
      }),
    ]);
    const base = this.cfg.get('API_PUBLIC_URL', 'http://localhost:3001');
    const data = projects.map((p) => {
      const c = p.components[0];
      const last = c?.entries[0];
      const d = (last?.data ?? {}) as Record<string, unknown>;
      return {
        name: p.name, slug: p.slug, description: p.description, theme: p.theme ?? null,
        posts: c?._count.entries ?? 0,
        lastPublishedAt: last?.publishedAt ?? null,
        lastTitle: typeof d.title === 'string' ? d.title : null,
        cover: typeof d.cover === 'string' ? `${base}/api/v1/public/${p.slug}/media/${d.cover}` : null,
      };
    });
    return { data, meta: pageMeta(total, pg, lim) };
  }
}
