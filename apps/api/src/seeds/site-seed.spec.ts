import { seedSite, seedSites, SITE_SEEDS } from './site-seed';
import { bchiwaleSeed } from './bchiwale/definition';

const env = { ADMIN_EMAIL: 'Admin@Site.PT', SEED_BCHIWALE_ORIGINS: 'https://a.pt, https://b.pt' } as NodeJS.ProcessEnv;
const owner = { id: 'u1', name: 'Admin', workspaces: [{ id: 'w1' }] };

let seq = 0;
const storage = () => ({ put: jest.fn().mockResolvedValue(undefined) });

function mk({ user = owner as any, project = null as any, components = {} as Record<string, any> } = {}) {
  return {
    user: { findUnique: jest.fn().mockResolvedValue(user) },
    workspace: { create: jest.fn().mockResolvedValue({ id: 'w2' }) },
    project: { findUnique: jest.fn().mockResolvedValue(project), create: jest.fn().mockResolvedValue({ id: 'p1' }) },
    component: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(components[where.projectId_slug.slug] ?? null)),
      create: jest.fn(),
    },
    componentField: { createMany: jest.fn() },
    mediaAsset: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn(({ data }: any) => Promise.resolve({ id: `m${++seq}`, ...data })),
    },
  } as any;
}

describe('seedSite (bchiwale)', () => {
  it('ignora se o admin não existe', async () => {
    const p = mk({ user: null });
    expect((await seedSite(p, bchiwaleSeed, env, storage())).status).toBe('skipped');
    expect(p.project.create).not.toHaveBeenCalled();
  });

  it('numa BD nova cria projeto, todos os componentes e entradas publicadas válidas', async () => {
    const p = mk();
    const r = await seedSite(p, bchiwaleSeed, env, storage());
    expect(r.status).toBe('created');
    expect(p.project.create.mock.calls[0][0].data).toMatchObject({
      slug: 'bchiwale', workspaceId: 'w1', allowedOrigins: ['https://a.pt', 'https://b.pt'],
    });
    expect(p.component.create).toHaveBeenCalledTimes(bchiwaleSeed.components.length);
    for (const [[{ data }], i] of p.component.create.mock.calls.map((c: any, i: number) => [c, i])) {
      const def = bchiwaleSeed.components[i];
      const entries = data.entries.create;
      expect(entries).toHaveLength(def.rows.length);
      expect(new Set(entries.map((e: any) => e.slug)).size).toBe(entries.length); // slugs únicos
      expect(entries.every((e: any) => e.status === 'PUBLISHED')).toBe(true);
      const times = entries.map((e: any) => +e.publishedAt);
      expect([...times].sort((a, b) => a - b)).toEqual(times); // ordem editorial preservada
    }
  });

  it('envia os ficheiros para a Media Library e referencia-os por id / media://id', async () => {
    const p = mk(); const st = storage();
    await seedSite(p, bchiwaleSeed, env, st);
    const by = (slug: string) => p.component.create.mock.calls.map((c: any) => c[0].data).find((d: any) => d.slug === slug).entries.create;
    const uploaded = st.put.mock.calls.map((c: any) => c[0]);
    expect(uploaded.length).toBe(p.mediaAsset.create.mock.calls.length);
    expect(new Set(uploaded).size).toBe(uploaded.length); // cada ficheiro só uma vez
    expect(st.put.mock.calls.some((c: any) => c[2] === 'video/mp4')).toBe(true);
    expect(by('team')[0].data.photo).toMatch(/^m\d+$/); // campo image → id
    expect(by('site-media').find((e: any) => e.slug === 'about-video').data.file).toMatch(/^m\d+$/); // vídeo (campo file)
    expect(by('site-media').find((e: any) => e.slug === 'logo').data.file).toMatch(/^m\d+$/);
    expect(by('hero-slides')[0].data.image).toMatch(/^m\d+$/);
    // nenhum caminho local ficou para trás
    expect(JSON.stringify(p.component.create.mock.calls)).not.toMatch(/"\/(images\/|logo|icone|about-video)/);
  });

  it('é idempotente: componentes existentes não são reescritos', async () => {
    const existing = Object.fromEntries(bchiwaleSeed.components.map((c) => [c.slug, { id: c.slug, fields: c.fields.map((f) => ({ key: f.key })) }]));
    const p = mk({ project: { id: 'p1' }, components: existing });
    expect((await seedSite(p, bchiwaleSeed, env, storage())).status).toBe('unchanged');
    expect(p.project.create).not.toHaveBeenCalled();
    expect(p.component.create).not.toHaveBeenCalled();
    expect(p.componentField.createMany).not.toHaveBeenCalled();
    expect(p.mediaAsset.create).not.toHaveBeenCalled();
  });

  it('acrescenta apenas campos em falta, sem tocar no conteúdo', async () => {
    const svc = bchiwaleSeed.components[0];
    const existing = { [svc.slug]: { id: 'c1', fields: svc.fields.slice(1).map((f) => ({ key: f.key })) } };
    const rest = Object.fromEntries(bchiwaleSeed.components.slice(1).map((c) => [c.slug, { id: c.slug, fields: c.fields.map((f) => ({ key: f.key })) }]));
    const p = mk({ project: { id: 'p1' }, components: { ...existing, ...rest } });
    const r = await seedSite(p, bchiwaleSeed, env, storage());
    expect(r).toMatchObject({ status: 'updated', components: [svc.slug] });
    expect(p.componentField.createMany.mock.calls[0][0].data.map((d: any) => d.key)).toEqual([svc.fields[0].key]);
    expect(p.component.create).not.toHaveBeenCalled();
  });
});

describe('seedSites', () => {
  it('SEED_SITES=none desativa', async () => {
    expect(await seedSites(mk(), { ...env, SEED_SITES: 'none' }, storage())).toEqual([]);
  });
  it('por defeito semeia o bchiwale', async () => {
    expect(Object.keys(SITE_SEEDS)).toContain('bchiwale');
    expect((await seedSites(mk(), env, storage()))[0].project).toBe('bchiwale');
  });
});
