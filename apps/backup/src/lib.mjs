// Funções puras (sem I/O) do serviço de backups — cobertas por test/lib.test.mjs

const pad = (n, w = 2) => String(n).padStart(w, '0');

/** Date → id UTC ordenável: 20261105T030000Z */
export function makeId(d = new Date()) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}
export const isValidId = (id) => typeof id === 'string' && /^\d{8}T\d{6}Z$/.test(id);

export function parseId(id) {
  if (!isValidId(id)) throw new Error(`id inválido: ${id}`);
  return new Date(Date.UTC(+id.slice(0, 4), +id.slice(4, 6) - 1, +id.slice(6, 8), +id.slice(9, 11), +id.slice(11, 13), +id.slice(13, 15)));
}

export const setFiles = (id) => ({
  db: `dynamix-${id}-postgres.dump`,
  media: `dynamix-${id}-media.tar.gz`,
  meta: `dynamix-${id}.json`,
});

/** Chave de semana ISO (YYYY-Www) em UTC */
export function isoWeekKey(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const week = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad(week)}`;
}

/**
 * Retenção GFS: mantém o backup MAIS RECENTE de cada um dos últimos N dias / N semanas / N meses
 * (com backups), mais sempre o mais recente de todos. Devolve o Set de ids a manter.
 */
export function selectToKeep(ids, { daily = 7, weekly = 4, monthly = 6 } = {}) {
  const sorted = [...ids].filter(isValidId).sort().reverse();
  const keep = new Set();
  if (sorted[0]) keep.add(sorted[0]);
  const rules = [
    [daily, (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`],
    [weekly, isoWeekKey],
    [monthly, (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`],
  ];
  for (const [n, keyOf] of rules) {
    const seen = new Set();
    for (const id of sorted) {
      const k = keyOf(parseId(id));
      if (!seen.has(k) && seen.size < n) { seen.add(k); keep.add(id); }
    }
  }
  return keep;
}

/** "03:00, 15:30" → ["03:00","15:30"] (UTC). Lança erro em formato inválido. */
export function parseTimes(str) {
  const list = String(str).split(',').map((s) => s.trim()).filter(Boolean);
  if (!list.length) throw new Error('BACKUP_TIMES vazio');
  for (const t of list) if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) throw new Error(`hora inválida em BACKUP_TIMES: "${t}" (use HH:MM, UTC)`);
  return [...new Set(list)].sort();
}

/** Próxima execução (UTC) estritamente depois de `now`. */
export function nextRun(times, now = new Date()) {
  for (let add = 0; add <= 1; add++) {
    for (const t of times) {
      const [h, m] = t.split(':').map(Number);
      const c = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + add, h, m, 0));
      if (c > now) return c;
    }
  }
  throw new Error('sem próxima execução');
}

export const dueNow = (times, now = new Date()) => times.includes(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`);

/** Backups feitos automaticamente antes de operações arriscadas: nunca competem com a retenção normal. */
export const SAFETY_TRIGGERS = ['pre-migrate', 'pre-restore'];

/**
 * Plano de retenção completo. `sets` = [{id, trigger}].
 *  - rotina (schedule/startup/manual/cli): GFS (selectToKeep)
 *  - segurança (pre-migrate/pre-restore): os `safety` mais recentes, à parte
 * Devolve o Set de ids a manter.
 */
export function planRetention(sets, { daily = 7, weekly = 4, monthly = 6, safety = 5 } = {}) {
  const routine = sets.filter((s) => !SAFETY_TRIGGERS.includes(s.trigger)).map((s) => s.id);
  const safe = sets.filter((s) => SAFETY_TRIGGERS.includes(s.trigger)).map((s) => s.id).sort().reverse().slice(0, safety);
  const keep = selectToKeep(routine, { daily, weekly, monthly });
  for (const id of safe) keep.add(id);
  // o mais recente de todos nunca é removido
  const newest = sets.map((s) => s.id).sort().at(-1);
  if (newest) keep.add(newest);
  return keep;
}
