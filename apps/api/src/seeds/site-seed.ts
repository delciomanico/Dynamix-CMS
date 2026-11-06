/**
 * Seed de sites — cria, num Dynamix acabado de instalar, o projeto de um site com todos os
 * componentes (estrutura) e o conteúdo inicial publicado, ficando logo disponíveis os endpoints
 * `/api/v1/public/{project}/...`.
 *
 * Idempotente e não destrutivo (corre em cada deploy):
 *  - projeto existe            → não é tocado;
 *  - componente existe         → só acrescenta campos novos em falta; o conteúdo NUNCA é reescrito
 *                                (edições feitas no dashboard sobrevivem a novos deploys);
 *  - componente não existe     → cria componente + campos + entradas publicadas (numa transação).
 * O dono é um utilizador dedicado do site (ex. geral@bchiwale.ao, criado com SEED_<KEY>_OWNER_PASSWORD) ou,
 * se o site não definir dono, o ADMIN_EMAIL (que precisa de já existir — corre depois de seedAdmin).
 *
 * Env: SEED_SITES (lista separada por vírgulas; defeito "bchiwale"; "none" desativa),
 *      SEED_BCHIWALE_ORIGINS (domínios autorizados no CORS, ex. https://bchiwale.com), SEED_BCHIWALE_URL.
 */
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { basename, extname, join } from 'path';
import { StorageService } from '../storage/storage.service';
import { slugify } from '../common/slug';
import { validateEntryData } from '../common/field-types';
import { bchiwaleSeed } from './bchiwale/definition';
import type { SiteSeed } from './types';

export interface AssetStore { put(key: string, body: Buffer, contentType: string): Promise<void> }

const ASSET = /^\/[^\s?#]+\.(jpe?g|png|svg|webp|gif|avif|mp4|webm|pdf)$/i;
const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.gif': 'image/gif', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.pdf': 'application/pdf',
};
const ASSETS_ROOT = join(__dirname, '..', '..', 'seed-assets');

/** Aplica `fn` a todas as strings de um valor JSON (qualquer profundidade). */
async function mapStrings(v: unknown, fn: (s: string) => Promise<string>): Promise<unknown> {
  if (typeof v === 'string') return fn(v);
  if (Array.isArray(v)) return Promise.all(v.map((x) => mapStrings(x, fn)));
  if (v && typeof v === 'object') return Object.fromEntries(await Promise.all(Object.entries(v).map(async ([k, x]) => [k, await mapStrings(x, fn)])));
  return v;
}

export const SITE_SEEDS: Record<string, SiteSeed> = { [bchiwaleSeed.project]: bchiwaleSeed };

export interface SiteSeedResult { project: string; status: 'skipped' | 'created' | 'updated' | 'unchanged'; components: string[] }

/**
 * Dono do projeto: utilizador dedicado (SEED_<KEY>_OWNER_EMAIL, defeito `site.owner.email`) — criado com
 * SEED_<KEY>_OWNER_PASSWORD (≥ 12 caracteres) se não existir; nunca altera a password de um existente.
 * Sem dono configurado, usa o ADMIN_EMAIL (se existir).
 */
async function resolveOwner(prisma: PrismaClient, site: SiteSeed, key: string, env: NodeJS.ProcessEnv) {
  const withWs = { workspaces: { orderBy: { createdAt: 'asc' as const }, take: 1 } };
  const email = (env[`SEED_${key}_OWNER_EMAIL`] || site.owner?.email)?.trim().toLowerCase();
  if (!email) {
    const admin = env.ADMIN_EMAIL?.trim().toLowerCase();
    return admin ? prisma.user.findUnique({ where: { email: admin }, include: withWs }) : null;
  }
  const existing = await prisma.user.findUnique({ where: { email }, include: withWs });
  if (existing) return existing;
  const password = env[`SEED_${key}_OWNER_PASSWORD`];
  if (!password) throw new Error(`[seed] defina SEED_${key}_OWNER_PASSWORD (≥ 12 caracteres) para criar o utilizador ${email}`);
  if (password.length < 12) throw new Error(`SEED_${key}_OWNER_PASSWORD deve ter pelo menos 12 caracteres`);
  const name = site.owner?.name ?? email;
  return prisma.user.create({
    data: { name, email, role: 'USER', passwordHash: await bcrypt.hash(password, 12), workspaces: { create: { name: `${name} — Workspace` } } },
    include: withWs,
  });
}

export async function seedSite(prisma: PrismaClient, site: SiteSeed, env: NodeJS.ProcessEnv = process.env, storage?: AssetStore): Promise<SiteSeedResult> {
  const key = site.project.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  let created = false;
  let project = await prisma.project.findUnique({ where: { slug: site.project } });
  if (!project) {
    const owner = await resolveOwner(prisma, site, key, env);
    if (!owner) return { project: site.project, status: 'skipped', components: [] };
    const workspace = owner.workspaces[0] ?? (await prisma.workspace.create({ data: { name: `${owner.name} — Workspace`, ownerId: owner.id } }));
    project = await prisma.project.create({
      data: {
        workspaceId: workspace.id, name: site.name, slug: site.project, description: site.description,
        frontendUrl: env[`SEED_${key}_URL`] || null,
        allowedOrigins: (env[`SEED_${key}_ORIGINS`] ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      },
    });
    created = true;
  }

  // Ficheiros do seed → Media Library (MinIO + MediaAsset). Chave determinística ⇒ idempotente; só corre quando há conteúdo a semear.
  const projectId = project.id;
  const assetIds = new Map<string, Promise<string>>();
  const assetId = (rel: string) => {
    if (!assetIds.has(rel)) assetIds.set(rel, (async () => {
      const key = `${projectId}/seed${rel}`;
      const have = await prisma.mediaAsset.findUnique({ where: { key } });
      if (have) return have.id;
      if (!storage || !site.assetsDir) throw new Error(`[seed] ${rel}: sem armazenamento/pasta de assets configurados`);
      const body = await readFile(join(ASSETS_ROOT, site.assetsDir, rel));
      const mimeType = MIME[extname(rel).toLowerCase()];
      await storage.put(key, body, mimeType);
      return (await prisma.mediaAsset.create({ data: { projectId, key, filename: basename(rel), mimeType, size: body.length } })).id;
    })());
    return assetIds.get(rel)!;
  };
  async function withMedia(defs: { key: string; type: string }[], row: Record<string, unknown>) {
    const out: Record<string, unknown> = { ...row };
    for (const d of defs) {
      const v = row[d.key];
      if ((d.type === 'image' || d.type === 'file') && typeof v === 'string' && ASSET.test(v)) out[d.key] = await assetId(v);
      else if (d.type === 'json' && v !== undefined) out[d.key] = await mapStrings(v, async (s) => (ASSET.test(s) ? `media://${await assetId(s)}` : s));
    }
    return out;
  }

  const touched: string[] = [];
  for (const c of site.components) {
    const existing = await prisma.component.findUnique({ where: { projectId_slug: { projectId: project.id, slug: c.slug } }, include: { fields: true } });
    if (existing) {
      const have = new Set(existing.fields.map((x) => x.key));
      const missing = c.fields.filter((x) => !have.has(x.key));
      if (missing.length) {
        await prisma.componentField.createMany({
          data: missing.map((x, i) => ({
            componentId: existing.id, key: x.key, label: x.label, type: x.type, required: !!x.required,
            options: x.options ?? [], position: existing.fields.length + i,
          })),
        });
        touched.push(c.slug);
      }
      continue;
    }

    const defs = c.fields.map((x) => ({ key: x.key, label: x.label, type: x.type, required: !!x.required, options: x.options ?? [] }));
    const used = new Set<string>();
    const now = Date.now();
    const prepared = await Promise.all(c.rows.map((r) => withMedia(defs, r)));
    const entries = prepared.map((row, i) => {
      const base = slugify(String((c.slugOf ?? ((r) => String(r.slug ?? '')))(c.rows[i], i))) || `item-${i + 1}`;
      let slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
      used.add(slug);
      const { slug: _omit, ...fields } = row;
      return {
        slug,
        data: validateEntryData(defs, fields) as object,
        status: 'PUBLISHED' as const,
        // A API pública só ordena por data → a ordem editorial do seed é codificada em publishedAt (crescente).
        publishedAt: new Date(now - (c.rows.length - i) * 1000),
      };
    });

    await prisma.component.create({
      data: {
        projectId: project.id, name: c.name, slug: c.slug, description: c.description,
        fields: { create: defs.map((d, position) => ({ ...d, position })) },
        entries: { create: entries },
      },
    });
    touched.push(c.slug);
  }
  return { project: site.project, status: created ? 'created' : touched.length ? 'updated' : 'unchanged', components: touched };
}

export async function seedSites(prisma: PrismaClient, env: NodeJS.ProcessEnv = process.env, store?: AssetStore) {
  const wanted = (env.SEED_SITES ?? 'bchiwale').split(',').map((s) => s.trim()).filter((s) => s && s !== 'none');
  const results: SiteSeedResult[] = [];
  let storage: AssetStore | undefined = store;
  if (wanted.length && !storage) {
    const real = new StorageService({ get: (k: string, d?: string) => env[k] ?? d } as unknown as ConfigService);
    await real.onModuleInit(); // garante o bucket
    storage = real;
  }
  for (const name of wanted) {
    const site = SITE_SEEDS[name];
    if (!site) { console.warn(`[seed] site desconhecido em SEED_SITES: "${name}" (disponíveis: ${Object.keys(SITE_SEEDS).join(', ')})`); continue; }
    results.push(await seedSite(prisma, site, env, storage));
  }
  return results;
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedSites(prisma)
    .then((r) => r.forEach((x) => console.log(`[seed] site ${x.project}: ${x.status}${x.components.length ? ` (${x.components.join(', ')})` : ''}`)))
    .catch((e) => { console.error('[seed] falhou:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
}
