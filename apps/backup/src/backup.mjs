#!/usr/bin/env node
// Dynamix backups — PostgreSQL (pg_dump) + MinIO (rclone → tar.gz), retenção GFS, offsite opcional (rclone),
// API de controlo interna e CLI.   Uso:  node src/backup.mjs <daemon|run|list|status|verify|prune|delete|restore> [opções]
import { spawn } from 'node:child_process';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { dueNow, isValidId, makeId, nextRun, parseTimes, planRetention, setFiles } from './lib.mjs';

const env = process.env;
const cfg = {
  dir: env.BACKUP_DIR ?? '/backups',
  times: parseTimes(env.BACKUP_TIMES ?? '03:00'),
  keep: { daily: +(env.BACKUP_KEEP_DAILY ?? 7), weekly: +(env.BACKUP_KEEP_WEEKLY ?? 4), monthly: +(env.BACKUP_KEEP_MONTHLY ?? 6), safety: +(env.BACKUP_KEEP_SAFETY ?? 5) },
  runOnStart: (env.BACKUP_RUN_ON_START ?? 'true') === 'true',
  token: env.BACKUP_TOKEN ?? '',
  port: +(env.BACKUP_PORT ?? 8081),
  offsite: (env.BACKUP_OFFSITE ?? '').replace(/\/+$/, ''), // ex.: offsite:meu-bucket/dynamix
  db: env.PGDATABASE ?? 'dynamix',
  bucket: env.S3_BUCKET ?? 'dynamix-media',
  version: env.APP_VERSION ?? 'dev',
};
const tmpRoot = () => join(cfg.dir, '.tmp');
const log = (...a) => console.log(new Date().toISOString(), '[backup]', ...a);

// ---------- helpers de processo / ficheiros ----------
function exec(cmd, args, { env: extra = {}, allow = [0] } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { env: { ...env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (allow.includes(code) ? resolve({ code, out }) : reject(new Error(`${cmd} saiu com código ${code}: ${err.trim().slice(-500)}`))));
  });
}
const sha256 = (file) => new Promise((res, rej) => {
  const h = createHash('sha256');
  createReadStream(file).on('data', (d) => h.update(d)).on('end', () => res(h.digest('hex'))).on('error', rej);
});
const size = async (f) => (await stat(f)).size;
async function writeJson(file, obj) { await writeFile(`${file}.tmp`, JSON.stringify(obj, null, 2)); await rename(`${file}.tmp`, file); }
async function readJson(file, fallback = null) { try { return JSON.parse(await readFile(file, 'utf8')); } catch { return fallback; } }

// rclone configurado por variáveis de ambiente (sem ficheiro de config)
const rcloneEnv = {
  RCLONE_CONFIG_SRC_TYPE: 's3', RCLONE_CONFIG_SRC_PROVIDER: 'Minio',
  RCLONE_CONFIG_SRC_ENDPOINT: env.S3_ENDPOINT ?? 'http://minio:9000',
  RCLONE_CONFIG_SRC_ACCESS_KEY_ID: env.S3_ACCESS_KEY ?? '', RCLONE_CONFIG_SRC_SECRET_ACCESS_KEY: env.S3_SECRET_KEY ?? '',
  RCLONE_CONFIG_SRC_REGION: env.S3_REGION ?? 'us-east-1',
};
const rclone = (args, opts = {}) => exec('rclone', args, { env: rcloneEnv, ...opts });

// ---------- estado ----------
let running = false;
const statusFile = () => join(cfg.dir, 'status.json');

export async function listSets() {
  const names = existsSync(cfg.dir) ? await readdir(cfg.dir) : [];
  const metas = await Promise.all(names.filter((n) => /^dynamix-\d{8}T\d{6}Z\.json$/.test(n)).map((n) => readJson(join(cfg.dir, n))));
  return metas.filter(Boolean).sort((a, b) => (a.id < b.id ? 1 : -1));
}

// ---------- backup ----------
export async function runBackup({ trigger = 'manual', label = '', prune: doPrune = true } = {}) {
  if (running) throw new Error('Já existe um backup em curso');
  running = true;
  const started = new Date();
  const id = makeId(started);
  const f = setFiles(id);
  const P = (n) => join(cfg.dir, n);
  const stage = join(tmpRoot(), id);
  try {
    await mkdir(stage, { recursive: true });
    log(`início ${id} (${trigger})`);

    // 1) PostgreSQL — formato custom (comprimido, restauro seletivo)
    await exec('pg_dump', ['-Fc', '--no-owner', '--no-acl', '-d', cfg.db, '-f', `${P(f.db)}.partial`]);
    await rename(`${P(f.db)}.partial`, P(f.db));

    // 2) MinIO — copia o bucket e empacota
    await mkdir(join(stage, 'media'), { recursive: true });
    await rclone(['copy', `src:${cfg.bucket}`, join(stage, 'media'), '--transfers', '8'], { allow: [0, 3] }); // 3 = bucket vazio/inexistente
    await exec('tar', ['czf', `${P(f.media)}.partial`, '-C', stage, 'media']);
    await rename(`${P(f.media)}.partial`, P(f.media));

    // 3) verificação (integridade do ficheiro, não só "ficheiro existe")
    await exec('pg_restore', ['--list', P(f.db)]);
    await exec('tar', ['tzf', P(f.media)]);
    const meta = {
      id, createdAt: started.toISOString(), trigger, label, version: cfg.version,
      db: { file: f.db, bytes: await size(P(f.db)), sha256: await sha256(P(f.db)) },
      media: { file: f.media, bytes: await size(P(f.media)), sha256: await sha256(P(f.media)) },
      verified: true, offsite: cfg.offsite ? 'pending' : 'disabled', durationMs: Date.now() - started,
    };

    // 4) offsite (opcional). Falhar aqui NÃO invalida o backup local, mas fica visível.
    if (cfg.offsite) {
      try {
        for (const n of [f.db, f.media]) await rclone(['copyto', P(n), `${cfg.offsite}/${n}`]);
        meta.offsite = 'ok';
      } catch (e) { meta.offsite = 'error'; meta.offsiteError = e.message; log('offsite falhou:', e.message); }
    }
    await writeJson(P(f.meta), meta); // o json é o marcador de "conjunto completo"
    if (cfg.offsite && meta.offsite === 'ok') await rclone(['copyto', P(f.meta), `${cfg.offsite}/${f.meta}`]).catch(() => {});

    const st = await readJson(statusFile(), {});
    await writeJson(statusFile(), { ...st, lastRun: { id, ok: true, trigger, startedAt: started.toISOString(), finishedAt: new Date().toISOString() }, lastSuccessAt: new Date().toISOString() });
    log(`ok ${id} db=${meta.db.bytes}B media=${meta.media.bytes}B offsite=${meta.offsite}`);
    if (doPrune) await prune().catch((e) => log('prune falhou:', e.message)); // só depois de um backup bem-sucedido
    return meta;
  } catch (e) {
    for (const n of [`${f.db}.partial`, `${f.media}.partial`, f.db, f.media]) await rm(P(n), { force: true });
    const st = await readJson(statusFile(), {});
    await writeJson(statusFile(), { ...st, lastRun: { id, ok: false, trigger, startedAt: started.toISOString(), finishedAt: new Date().toISOString(), error: e.message } });
    log(`FALHOU ${id}:`, e.message);
    throw e;
  } finally {
    await rm(stage, { recursive: true, force: true });
    running = false;
  }
}

// ---------- retenção ----------
export async function removeSet(id) {
  if (!isValidId(id)) throw new Error('id inválido');
  const f = setFiles(id);
  for (const n of [f.meta, f.db, f.media]) {
    await rm(join(cfg.dir, n), { force: true });
    if (cfg.offsite) await rclone(['deletefile', `${cfg.offsite}/${n}`], { allow: [0, 3, 4] }).catch(() => {});
  }
}
export async function prune({ dryRun = false } = {}) {
  const sets = await listSets();
  const keep = planRetention(sets.map((s) => ({ id: s.id, trigger: s.trigger })), cfg.keep);
  const remove = sets.filter((s) => !keep.has(s.id)).map((s) => s.id);
  if (!dryRun) for (const id of remove) { await removeSet(id); log('removido', id); }
  // limpa restos de execuções interrompidas (>1h)
  if (!dryRun && existsSync(cfg.dir)) {
    for (const n of await readdir(cfg.dir)) {
      if (!n.endsWith('.partial') && !n.endsWith('.tmp')) continue;
      if (Date.now() - (await stat(join(cfg.dir, n))).mtimeMs > 3_600_000) await rm(join(cfg.dir, n), { force: true });
    }
  }
  return { kept: [...keep], removed: remove, dryRun };
}

// ---------- verificação / restauro ----------
export async function verifySet(id) {
  const meta = await readJson(join(cfg.dir, setFiles(id).meta));
  if (!meta) throw new Error(`backup ${id} não encontrado`);
  for (const k of ['db', 'media']) {
    const file = join(cfg.dir, meta[k].file);
    if ((await sha256(file)) !== meta[k].sha256) throw new Error(`checksum inválido em ${meta[k].file}`);
  }
  await exec('pg_restore', ['--list', join(cfg.dir, meta.db.file)]);
  await exec('tar', ['tzf', join(cfg.dir, meta.media.file)]);
  return { id, ok: true };
}

async function fetchFromOffsite(id) {
  if (!cfg.offsite) throw new Error(`backup ${id} não existe localmente e não há offsite configurado`);
  const f = setFiles(id);
  for (const n of [f.meta, f.db, f.media]) await rclone(['copyto', `${cfg.offsite}/${n}`, join(cfg.dir, n)]);
  log(`${id} descarregado do offsite`);
}

export async function restore({ id, only = 'all', safety = true }) {
  if (!['all', 'db', 'media'].includes(only)) throw new Error('--only deve ser db, media ou all');
  const f = setFiles(id);
  if (!existsSync(join(cfg.dir, f.meta))) await fetchFromOffsite(id);
  await verifySet(id);
  if (safety) { log('a criar backup de segurança antes do restauro…'); await runBackup({ trigger: 'pre-restore', label: `antes de restaurar ${id}`, prune: false }); } // nunca podar durante um restauro
  if (only !== 'media') {
    log('a restaurar PostgreSQL…');
    await exec('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-acl', '--single-transaction', '--exit-on-error', '-d', cfg.db, join(cfg.dir, f.db)]);
  }
  if (only !== 'db') {
    log('a restaurar MinIO…');
    const stage = join(tmpRoot(), `restore-${id}`);
    await mkdir(stage, { recursive: true });
    try {
      await exec('tar', ['xzf', join(cfg.dir, f.media), '-C', stage]);
      await rclone(['sync', join(stage, 'media'), `src:${cfg.bucket}`]);
    } finally { await rm(stage, { recursive: true, force: true }); }
  }
  log(`restauro de ${id} concluído (${only})`);
  return { id, only, ok: true };
}

// ---------- estado para UI / API ----------
export async function getStatus() {
  const [sets, st] = await Promise.all([listSets(), readJson(statusFile(), {})]);
  return {
    enabled: true, running, schedule: cfg.times, nextRun: nextRun(cfg.times).toISOString(),
    retention: cfg.keep, offsite: !!cfg.offsite, lastRun: st.lastRun ?? null, lastSuccessAt: st.lastSuccessAt ?? null,
    totalBytes: sets.reduce((n, s) => n + s.db.bytes + s.media.bytes, 0),
    backups: sets.map((s) => ({ id: s.id, createdAt: s.createdAt, trigger: s.trigger, label: s.label, dbBytes: s.db.bytes, mediaBytes: s.media.bytes, offsite: s.offsite, verified: s.verified, version: s.version })),
  };
}

// ---------- API de controlo (só rede interna, Bearer token) ----------
function startServer() {
  if (!cfg.token || cfg.token.length < 16) { log('BACKUP_TOKEN em falta/curto (<16): API de controlo DESATIVADA'); return; }
  const authed = (req) => {
    const got = Buffer.from((req.headers.authorization ?? '').replace(/^Bearer /, ''));
    const want = Buffer.from(cfg.token);
    return got.length === want.length && timingSafeEqual(got, want);
  };
  createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (!authed(req)) return send(401, { message: 'unauthorized' });
    const url = new URL(req.url, 'http://x');
    try {
      if (req.method === 'GET' && url.pathname === '/status') return send(200, await getStatus());
      if (req.method === 'POST' && url.pathname === '/run') {
        const opts = { trigger: url.searchParams.get('trigger') ?? 'manual', label: (url.searchParams.get('label') ?? '').slice(0, 80) };
        if (running) return send(409, { message: 'Já existe um backup em curso' });
        if (url.searchParams.get('wait') === '1') return send(200, await runBackup(opts));
        runBackup(opts).catch(() => {});
        return send(202, { started: true });
      }
      const m = /^\/backups\/([^/]+)$/.exec(url.pathname);
      if (req.method === 'DELETE' && m) {
        if (!isValidId(m[1])) return send(400, { message: 'id inválido' });
        await removeSet(m[1]);
        return send(200, { ok: true });
      }
      send(404, { message: 'not found' });
    } catch (e) { send(500, { message: e.message }); }
  }).listen(cfg.port, () => log(`API de controlo em :${cfg.port}`));
}

// ---------- daemon ----------
async function daemon() {
  await mkdir(cfg.dir, { recursive: true });
  log(`agenda (UTC): ${cfg.times.join(', ')} · retenção: ${JSON.stringify(cfg.keep)} · offsite: ${cfg.offsite || 'desativado'}`);
  startServer();
  const st = await readJson(statusFile(), {});
  const stale = !st.lastSuccessAt || Date.now() - Date.parse(st.lastSuccessAt) > 24 * 3_600_000;
  if (cfg.runOnStart && stale) setTimeout(() => runBackup({ trigger: 'startup' }).catch(() => {}), 20_000); // dá tempo à API de criar o bucket
  let lastMinute = '';
  setInterval(() => {
    const now = new Date();
    const minute = now.toISOString().slice(0, 16);
    if (minute !== lastMinute && dueNow(cfg.times, now) && !running) { lastMinute = minute; runBackup({ trigger: 'schedule' }).catch(() => {}); }
  }, 15_000);
}

// ---------- CLI ----------
const fmt = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1024).toFixed(1)} KB`);
function flags(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); o[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
  return o;
}
async function cli(cmd, argv) {
  const o = flags(argv);
  await mkdir(cfg.dir, { recursive: true });
  switch (cmd) {
    case 'run': await runBackup({ trigger: 'cli', label: typeof o.label === 'string' ? o.label : '' }); break;
    case 'list': {
      const sets = await listSets();
      if (!sets.length) return console.log('(sem backups)');
      for (const s of sets) console.log(`${s.id}  ${s.createdAt}  db=${fmt(s.db.bytes)}  media=${fmt(s.media.bytes)}  offsite=${s.offsite}  ${s.trigger}${s.label ? ` — ${s.label}` : ''}`);
      break;
    }
    case 'status': console.log(JSON.stringify(await getStatus(), null, 2)); break;
    case 'verify': {
      const ids = typeof o.id === 'string' ? [o.id] : (await listSets()).map((s) => s.id);
      for (const id of ids) { await verifySet(id); console.log(`ok  ${id}`); }
      break;
    }
    case 'prune': console.log(JSON.stringify(await prune({ dryRun: !!o['dry-run'] }), null, 2)); break;
    case 'delete': if (typeof o.id !== 'string') throw new Error('--id obrigatório'); await removeSet(o.id); console.log('removido', o.id); break;
    case 'restore': {
      if (typeof o.id !== 'string' || !isValidId(o.id)) throw new Error('--id <id> obrigatório (ver "list")');
      if (!o.yes) {
        console.log(`Isto vai SUBSTITUIR os dados atuais (${o.only ?? 'all'}) pelos do backup ${o.id}.\nPare a API antes (docker compose stop api) e repita com --yes.\nÉ criado um backup de segurança automático antes (desativar: --no-safety).`);
        process.exit(2);
      }
      await restore({ id: o.id, only: o.only ?? 'all', safety: !o['no-safety'] });
      break;
    }
    default: console.log('uso: backup.mjs <daemon|run|list|status|verify|prune|delete|restore> [--id ID] [--only db|media] [--label txt] [--yes] [--dry-run]'); process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [cmd = 'daemon', ...rest] = process.argv.slice(2);
  (cmd === 'daemon' ? daemon() : cli(cmd, rest)).catch((e) => { console.error('erro:', e.message); process.exit(1); });
}
