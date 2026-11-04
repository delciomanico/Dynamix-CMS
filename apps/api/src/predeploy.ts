/**
 * Passo único executado ANTES de cada nova versão da API arrancar (serviço `migrate`):
 *   1. há migrações pendentes numa BD que já tem dados?  → faz backup (Postgres + MinIO) e espera
 *   2. prisma migrate deploy
 *   3. seed idempotente do admin
 * Se o backup falhar, o deploy é abortado e a versão anterior continua a servir (a API nova nunca arranca).
 * PREDEPLOY_BACKUP: auto (defeito: ignora se não há serviço de backup) | required | skip
 */
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import { seedAdmin } from './seed';

export const hasPending = (statusOutput: string) => /have not yet been applied|not yet been applied/i.test(statusOutput);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const prismaCli = (args: string[], stdio: 'inherit' | 'pipe' = 'inherit') =>
  execFileSync('npx', ['prisma', ...args], { stdio, encoding: 'utf8' });

function migrationStatus(): string {
  try { return String(prismaCli(['migrate', 'status'], 'pipe')); }
  catch (e: any) { return `${e.stdout ?? ''}${e.stderr ?? ''}`; } // exit 1 quando há pendentes
}

export async function backupBeforeMigrate(env: NodeJS.ProcessEnv = process.env, fetchFn: typeof fetch = fetch) {
  const mode = env.PREDEPLOY_BACKUP ?? 'auto';
  if (mode === 'skip') return console.log('[predeploy] backup ignorado (PREDEPLOY_BACKUP=skip)');
  if (!env.BACKUP_URL || !env.BACKUP_TOKEN) {
    if (mode === 'required') throw new Error('PREDEPLOY_BACKUP=required mas BACKUP_URL/BACKUP_TOKEN não estão definidos');
    return console.warn('[predeploy] sem serviço de backup configurado — a continuar SEM backup');
  }
  const url = `${env.BACKUP_URL}/run?wait=1&trigger=pre-migrate&label=${encodeURIComponent(`antes de migrar (${env.APP_VERSION ?? 'dev'})`)}`;
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      const res = await fetchFn(url, { method: 'POST', headers: { Authorization: `Bearer ${env.BACKUP_TOKEN}` }, signal: AbortSignal.timeout(15 * 60_000) });
      if (res.status === 409) { console.log('[predeploy] já existe um backup em curso, a aguardar…'); await sleep(10_000); continue; }
      if (!res.ok) throw new Error(`serviço de backup respondeu ${res.status}: ${await res.text()}`);
      const meta: any = await res.json();
      return console.log(`[predeploy] backup ${meta.id} concluído`);
    } catch (e: any) {
      const unreachable = /fetch failed|ECONNREFUSED|ENOTFOUND/i.test(`${e.message} ${e.cause?.code ?? ''}`);
      if (unreachable && attempt < 12) { await sleep(5_000); continue; }
      if (unreachable && mode !== 'required') return console.warn('[predeploy] serviço de backup inacessível — a continuar SEM backup');
      throw e;
    }
  }
  throw new Error('backup não pôde ser concluído (timeout)');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const pending = hasPending(migrationStatus());
    const [{ ok }] = await prisma.$queryRaw<{ ok: boolean }[]>`SELECT to_regclass('public."User"') IS NOT NULL AS ok`;
    if (pending && ok) {
      console.log('[predeploy] migrações pendentes numa BD com dados → backup primeiro');
      await backupBeforeMigrate();
    } else console.log(pending ? '[predeploy] BD nova: sem backup necessário' : '[predeploy] sem migrações pendentes');
    prismaCli(['migrate', 'deploy']);
    console.log(`[predeploy] seed admin: ${await seedAdmin(prisma)}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) main().catch((e) => { console.error('[predeploy] FALHOU:', e.message); process.exit(1); });
