import { NotFoundException } from '@nestjs/common';
import { plain, SeoController } from './seo.controller';

const cfg: any = { get: (k: string, d?: string) => ({ WEB_URL: 'https://x.pt/', API_PUBLIC_URL: 'https://x.pt' }[k] ?? d) };

describe('SeoController', () => {
  it('robots bloqueia áreas privadas e aponta para o sitemap absoluto', () => {
    const r = new SeoController({} as any, cfg).robots();
    expect(r).toContain('Disallow: /app/');
    expect(r).toContain('Sitemap: https://x.pt/sitemap.xml');
  });

  it('sitemap inclui páginas fixas, blogs e artigos publicados (com escape)', async () => {
    const prisma: any = { project: { findMany: jest.fn().mockResolvedValue([{ slug: 'b', updatedAt: new Date(0), components: [{ entries: [{ slug: 'a&b', updatedAt: new Date(0) }] }] }]) } };
    const xml = await new SeoController(prisma, cfg).sitemap();
    expect(xml).toContain('<loc>https://x.pt/</loc>');
    expect(xml).toContain('<loc>https://x.pt/b/b</loc>');
    expect(xml).toContain('https://x.pt/b/b/a%26b');
    expect(xml).not.toContain('a&b<');
  });

  it('página de artigo escapa HTML e não expõe rascunhos', async () => {
    const send = jest.fn(); const res: any = { type: () => ({ send }) };
    const prisma: any = {
      project: { findFirst: jest.fn().mockResolvedValue({ id: 'p', name: 'Blog', slug: 'b', description: null }) },
      component: { findUnique: jest.fn().mockResolvedValue({ id: 'c' }) },
      contentEntry: { findFirst: jest.fn().mockResolvedValue({ slug: 's', publishedAt: null, updatedAt: new Date(0), data: { title: '<script>alert(1)</script>', body: 'Olá **mundo**', excerpt: 'Resumo "x"' } }) },
    };
    await new SeoController(prisma, cfg).page('b', 's', res);
    const html = send.mock.calls[0][0] as string;
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;');
    expect(prisma.contentEntry.findFirst.mock.calls[0][0].where.status).toBe('PUBLISHED');
  });

  it('404 para blog inexistente', async () => {
    const prisma: any = { project: { findFirst: jest.fn().mockResolvedValue(null) } };
    await expect(new SeoController(prisma, cfg).page('x', undefined, {} as any)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('plain remove a sintaxe Markdown', () => {
    expect(plain('## Título\n\nTexto **forte** [link](http://a.pt) ![i](/x.png)')).toBe('Título Texto forte link');
  });
});
