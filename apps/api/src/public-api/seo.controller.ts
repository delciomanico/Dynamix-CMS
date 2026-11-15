import { Controller, Get, Header, NotFoundException, Param, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { BLOG_COMPONENT } from '../common/blog';
import { PrismaService } from '../prisma/prisma.service';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
/** Texto simples a partir do Markdown (para descrições e conteúdo de crawlers). */
export const plain = (md: string) => md.replace(/```[\s\S]*?```/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#>*_`~-]+/g, ' ').replace(/\s+/g, ' ').trim();
const snip = (s: string, n = 160) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** robots.txt, sitemap.xml e páginas HTML com meta/JSON-LD para crawlers e pré-visualizações sociais (o nginx encaminha-os para aqui). */
@Throttle({ default: { limit: 3000, ttl: 60_000 } })
@ApiExcludeController()
@Controller('seo')
export class SeoController {
  constructor(private prisma: PrismaService, private cfg: ConfigService) {}

  private get site() { return this.cfg.get<string>('WEB_URL', 'http://localhost:5173').replace(/\/$/, ''); }
  private get api() { return this.cfg.get<string>('API_PUBLIC_URL', this.site).replace(/\/$/, ''); }

  @Get('robots')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=3600')
  robots() {
    return ['User-agent: *', 'Allow: /', 'Disallow: /app/', 'Disallow: /login', 'Disallow: /register', 'Disallow: /auth/', 'Disallow: /api/', '', `Sitemap: ${this.site}/sitemap.xml`, ''].join('\n');
  }

  @Get('sitemap')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=900')
  async sitemap() {
    const urls: { loc: string; lastmod?: Date; priority: string }[] = [
      { loc: `${this.site}/`, priority: '1.0' }, { loc: `${this.site}/blog`, priority: '0.8' }, { loc: `${this.site}/team`, priority: '0.5' },
    ];
    const blogs = await this.prisma.project.findMany({
      where: { kind: 'BLOG', components: { some: { slug: BLOG_COMPONENT, entries: { some: { status: 'PUBLISHED' } } } } },
      take: 1000, orderBy: { updatedAt: 'desc' },
      select: {
        slug: true, updatedAt: true,
        components: { where: { slug: BLOG_COMPONENT }, select: { entries: { where: { status: 'PUBLISHED' }, take: 1000, orderBy: { publishedAt: 'desc' }, select: { slug: true, updatedAt: true } } } },
      },
    });
    for (const b of blogs) {
      urls.push({ loc: `${this.site}/b/${b.slug}`, lastmod: b.updatedAt, priority: '0.7' });
      for (const e of b.components[0]?.entries ?? []) urls.push({ loc: `${this.site}/b/${b.slug}/${encodeURIComponent(e.slug)}`, lastmod: e.updatedAt, priority: '0.6' });
    }
    const body = urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  }

  /** HTML mínimo (com meta Open Graph, JSON-LD e o texto) de um blog ou artigo, para quem não corre JavaScript. */
  @Get(['page/:project', 'page/:project/:post'])
  @Header('Cache-Control', 'public, max-age=300')
  async page(@Param('project') slug: string, @Param('post') post: string | undefined, @Res() res: Response) {
    const p = await this.prisma.project.findFirst({ where: { slug, kind: 'BLOG' } });
    if (!p) throw new NotFoundException();
    const media = (id?: unknown) => (typeof id === 'string' ? `${this.api}/api/v1/public/${slug}/media/${id}` : undefined);
    let title = p.name; let desc = p.description ?? `Blog ${p.name}`; let url = `${this.site}/b/${slug}`; let image: string | undefined; let type = 'website'; let ld: object; let content = '';

    if (post) {
      const comp = await this.prisma.component.findUnique({ where: { projectId_slug: { projectId: p.id, slug: BLOG_COMPONENT } } });
      const e = comp && (await this.prisma.contentEntry.findFirst({ where: { componentId: comp.id, status: 'PUBLISHED', slug: post } }));
      if (!e) throw new NotFoundException();
      const d = e.data as Record<string, unknown>;
      const text = plain(String(d.body ?? ''));
      title = `${String(d.title ?? post)} — ${p.name}`; desc = snip(String(d.excerpt || text)); url = `${this.site}/b/${slug}/${encodeURIComponent(e.slug)}`;
      image = media(d.cover); type = 'article'; content = `<h1>${esc(d.title)}</h1><p>${esc(text)}</p>`;
      ld = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: d.title, description: desc, datePublished: e.publishedAt, dateModified: e.updatedAt, author: { '@type': 'Person', name: d.author ?? p.name }, image, mainEntityOfPage: url, publisher: { '@type': 'Organization', name: p.name } };
    } else {
      ld = { '@context': 'https://schema.org', '@type': 'Blog', name: p.name, description: desc, url };
      content = `<h1>${esc(p.name)}</h1><p>${esc(desc)}</p>`;
    }
    res.type('html').send(`<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${type}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:site_name" content="${esc(p.name)}">${image ? `<meta property="og:image" content="${esc(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(desc)}">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head><body>${content}</body></html>`);
  }
}
