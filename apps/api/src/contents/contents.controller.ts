import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { EntryStatus } from '@prisma/client';
import { AccessService } from '../common/access.service';
import { validateEntryData } from '../common/field-types';
import { slugify } from '../common/slug';
import { CurrentUser, JwtAuthGuard } from '../auth/auth.guards';
import { pageMeta, parsePage } from '../common/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

class EntryDto {
  @IsObject() data: Record<string, unknown>;
  @IsOptional() @IsString() slug?: string;
}
class UpdateEntryDto {
  @IsOptional() @IsObject() data?: Record<string, unknown>;
  @IsOptional() @IsString() slug?: string;
}

type U = { id: string };

/** Slug por defeito: primeiro campo de texto preenchido. */
function defaultSlug(fields: { key: string; type: string }[], data: Record<string, unknown>) {
  const f = fields.find((x) => x.type === 'text' && data[x.key]);
  return slugify(String(f ? data[f.key] : '')) || `entry-${Date.now().toString(36)}`;
}

@ApiTags('management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ContentsController {
  constructor(private prisma: PrismaService, private access: AccessService) {}

  /**
   * Lista conteúdos. `q` pesquisa (sem distinguir maiúsculas) no slug e em todos os valores;
   * `section` filtra pelo campo `section`/`group` ou, em falta, pelo prefixo do campo `key` (`nav.home` → `nav`) (convenção para organizar componentes grandes);
   * `sort=slug` ordena por slug (defeito: mais recentes).
   */
  @Get('components/:cid/entries')
  async list(
    @CurrentUser() u: U,
    @Param('cid') cid: string,
    @Query('status') status?: EntryStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('section') section?: string,
    @Query('sort') sort?: string,
  ) {
    await this.access.component(u.id, cid);
    const pg = parsePage(page, limit);
    const where: Prisma.ContentEntryWhereInput = { componentId: cid, ...(status && status in EntryStatus ? { status } : {}) };
    const term = (q ?? '').trim().slice(0, 100);
    const sec = (section ?? '').trim().slice(0, 100);
    if (term || sec) {
      const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
      const rows = await this.prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "ContentEntry"
        WHERE "componentId" = ${cid}
          AND (${term} = '' OR slug ILIKE ${like} OR data::text ILIKE ${like})
          AND (${sec} = '' OR COALESCE(data->>'section', data->>'group', NULLIF(split_part(data->>'key', '.', 1), '')) = ${sec})`;
      where.id = { in: rows.map((r) => r.id) };
    }
    const orderBy = sort === 'slug' ? { slug: 'asc' as const } : { updatedAt: 'desc' as const };
    const [total, data] = await Promise.all([
      this.prisma.contentEntry.count({ where }),
      this.prisma.contentEntry.findMany({ where, orderBy, skip: pg.skip, take: pg.take }),
    ]);
    return { data, meta: pageMeta(total, pg.page, pg.limit) };
  }

  /** Valores distintos do campo `section`/`group` com contagem (para os filtros por secção). */
  @Get('components/:cid/sections')
  async sections(@CurrentUser() u: U, @Param('cid') cid: string) {
    await this.access.component(u.id, cid);
    const rows = await this.prisma.$queryRaw<{ section: string; count: bigint }[]>`
      SELECT COALESCE(data->>'section', data->>'group', NULLIF(split_part(data->>'key', '.', 1), '')) AS section, COUNT(*) AS count
      FROM "ContentEntry" WHERE "componentId" = ${cid}
        AND COALESCE(data->>'section', data->>'group', NULLIF(split_part(data->>'key', '.', 1), '')) IS NOT NULL
      GROUP BY 1 ORDER BY 1`;
    return rows.map((r) => ({ section: r.section, count: Number(r.count) }));
  }

  @Post('components/:cid/entries')
  async create(@CurrentUser() u: U, @Param('cid') cid: string, @Body() d: EntryDto) {
    const c = await this.access.component(u.id, cid);
    const data = validateEntryData(c.fields, d.data);
    const base = slugify(d.slug ?? '') || defaultSlug(c.fields, data);
    let slug = base;
    for (let i = 2; await this.prisma.contentEntry.findUnique({ where: { componentId_slug: { componentId: cid, slug } } }); i++) slug = `${base}-${i}`;
    return this.prisma.contentEntry.create({ data: { componentId: cid, slug, data: data as object } });
  }

  @Get('entries/:id')
  async get(@CurrentUser() u: U, @Param('id') id: string) {
    const { component, ...entry } = await this.access.entry(u.id, id);
    return entry;
  }

  @Patch('entries/:id')
  async update(@CurrentUser() u: U, @Param('id') id: string, @Body() d: UpdateEntryDto) {
    const e = await this.access.entry(u.id, id);
    const slug = d.slug ? slugify(d.slug) : undefined;
    if (slug && slug !== e.slug) {
      const taken = await this.prisma.contentEntry.findUnique({ where: { componentId_slug: { componentId: e.componentId, slug } } });
      if (taken) throw new BadRequestException('Slug já em uso');
    }
    return this.prisma.contentEntry.update({
      where: { id },
      data: { slug, ...(d.data ? { data: validateEntryData(e.component.fields, d.data) as object } : {}) },
    });
  }

  private async setStatus(userId: string, id: string, status: EntryStatus) {
    await this.access.entry(userId, id);
    return this.prisma.contentEntry.update({
      where: { id },
      data: { status, ...(status === 'PUBLISHED' ? { publishedAt: new Date() } : {}) },
    });
  }

  @Post('entries/:id/publish')
  publish(@CurrentUser() u: U, @Param('id') id: string) {
    return this.setStatus(u.id, id, 'PUBLISHED');
  }
  @Post('entries/:id/unpublish')
  unpublish(@CurrentUser() u: U, @Param('id') id: string) {
    return this.setStatus(u.id, id, 'DRAFT');
  }
  @Post('entries/:id/archive')
  archive(@CurrentUser() u: U, @Param('id') id: string) {
    return this.setStatus(u.id, id, 'ARCHIVED');
  }

  @Delete('entries/:id')
  async remove(@CurrentUser() u: U, @Param('id') id: string) {
    await this.access.entry(u.id, id);
    await this.prisma.contentEntry.delete({ where: { id } });
    return { ok: true };
  }
}
