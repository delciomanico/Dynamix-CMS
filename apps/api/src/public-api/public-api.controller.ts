import { Controller, Get, Header, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';
import { pageMeta, parsePage } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

const SORTABLE = new Set(['publishedAt', 'createdAt', 'updatedAt', 'slug']);
const CACHE = 'public, max-age=30, stale-while-revalidate=60';

function coerce(v: string): string | number | boolean {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v !== '' && !Number.isNaN(Number(v))) return Number(v);
  return v;
}

@ApiTags('public')
@Controller('public/:project')
export class PublicApiController {
  constructor(private prisma: PrismaService, private storage: StorageService, private cfg: ConfigService) {}

  private async project(slug: string) {
    const p = await this.prisma.project.findUnique({ where: { slug } });
    if (!p) throw new NotFoundException('Projeto não encontrado');
    return p;
  }

  @Get('components')
  @Header('Cache-Control', CACHE)
  async components(@Param('project') slug: string) {
    const p = await this.project(slug);
    const data = await this.prisma.component.findMany({
      where: { projectId: p.id },
      select: { name: true, slug: true, description: true, fields: { select: { key: true, label: true, type: true, required: true, options: true }, orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
    return { data };
  }

  @Get('content/:component')
  @Header('Cache-Control', CACHE)
  async list(
    @Param('project') slug: string,
    @Param('component') cslug: string,
    @Query() query: Record<string, any>,
  ) {
    const p = await this.project(slug);
    const comp = await this.prisma.component.findUnique({
      where: { projectId_slug: { projectId: p.id, slug: cslug } },
      include: { fields: true },
    });
    if (!comp) throw new NotFoundException('Componente não encontrado');

    const { page, limit, skip, take } = parsePage(query.page, query.limit, 10);
    const sortRaw = String(query.sort ?? '-publishedAt');
    const desc = sortRaw.startsWith('-');
    const sortKey = sortRaw.replace(/^-/, '');
    const orderBy: Prisma.ContentEntryOrderByWithRelationInput = SORTABLE.has(sortKey)
      ? { [sortKey]: desc ? 'desc' : 'asc' }
      : { publishedAt: 'desc' };

    const where: Prisma.ContentEntryWhereInput = { componentId: comp.id, status: 'PUBLISHED' };
    const and: Prisma.ContentEntryWhereInput[] = [];

    // filter[campo]=valor — apenas campos definidos no componente
    const filters = (query.filter ?? {}) as Record<string, string>;
    for (const [k, v] of Object.entries(filters)) {
      if (comp.fields.some((f) => f.key === k) && typeof v === 'string') {
        and.push({ data: { path: [k], equals: coerce(v) } });
      }
    }
    if (typeof query.q === 'string' && query.q.trim()) {
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "ContentEntry"
        WHERE "componentId" = ${comp.id} AND status = 'PUBLISHED' AND data::text ILIKE ${'%' + query.q.trim() + '%'}`;
      and.push({ id: { in: rows.map((r) => r.id) } });
    }
    if (and.length) where.AND = and;

    const [total, rows] = await Promise.all([
      this.prisma.contentEntry.count({ where }),
      this.prisma.contentEntry.findMany({ where, orderBy, skip, take }),
    ]);
    return {
      data: rows.map((r) => this.shape(p.slug, comp.fields, r)),
      meta: pageMeta(total, page, limit),
    };
  }

  @Get('content/:component/:entry')
  @Header('Cache-Control', CACHE)
  async one(@Param('project') slug: string, @Param('component') cslug: string, @Param('entry') eslug: string) {
    const p = await this.project(slug);
    const comp = await this.prisma.component.findUnique({
      where: { projectId_slug: { projectId: p.id, slug: cslug } },
      include: { fields: true },
    });
    const entry = comp && (await this.prisma.contentEntry.findFirst({
      where: { componentId: comp.id, status: 'PUBLISHED', OR: [{ slug: eslug }, { id: eslug }] },
    }));
    if (!comp || !entry) throw new NotFoundException('Conteúdo não encontrado');
    return { data: this.shape(p.slug, comp.fields, entry) };
  }

  @Get('media/:id')
  async media(@Param('project') slug: string, @Param('id') id: string, @Res() res: Response) {
    const p = await this.project(slug);
    const m = await this.prisma.mediaAsset.findFirst({ where: { id, projectId: p.id } });
    if (!m) throw new NotFoundException('Ficheiro não encontrado');
    const obj = await this.storage.get(m.key);
    res.setHeader('Content-Type', m.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    obj.stream.pipe(res);
  }

  /** Resolve campos image/file (ids de media) para URLs públicas. */
  private shape(projectSlug: string, fields: { key: string; type: string }[], e: { id: string; slug: string; data: Prisma.JsonValue; publishedAt: Date | null }) {
    const base = this.cfg.get('API_PUBLIC_URL', 'http://localhost:3001');
    const data = { ...(e.data as Record<string, unknown>) };
    for (const f of fields) {
      if ((f.type === 'image' || f.type === 'file') && typeof data[f.key] === 'string') {
        data[f.key] = `${base}/api/v1/public/${projectSlug}/media/${data[f.key]}`;
      }
    }
    return { id: e.id, slug: e.slug, ...data, publishedAt: e.publishedAt };
  }
}
