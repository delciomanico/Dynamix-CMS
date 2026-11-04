import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planRetention, dueNow, isoWeekKey, isValidId, makeId, nextRun, parseId, parseTimes, selectToKeep, setFiles } from '../src/lib.mjs';

const d = (s) => new Date(s);

test('makeId / parseId são inversos e ids são ordenáveis', () => {
  const id = makeId(d('2026-11-05T03:00:09Z'));
  assert.equal(id, '20261105T030009Z');
  assert.equal(parseId(id).toISOString(), '2026-11-05T03:00:09.000Z');
  assert.ok(makeId(d('2026-11-05T03:00:09Z')) < makeId(d('2026-11-05T03:00:10Z')));
});

test('isValidId rejeita path traversal e lixo', () => {
  assert.ok(isValidId('20261105T030009Z'));
  for (const bad of ['../etc/passwd', '20261105', '', null, '20261105T030009Z/../x', '2026-11-05']) assert.equal(isValidId(bad), false);
  assert.throws(() => parseId('x'));
});

test('setFiles', () => {
  assert.deepEqual(setFiles('20261105T030009Z'), {
    db: 'dynamix-20261105T030009Z-postgres.dump', media: 'dynamix-20261105T030009Z-media.tar.gz', meta: 'dynamix-20261105T030009Z.json',
  });
});

test('isoWeekKey (fronteira de ano)', () => {
  assert.equal(isoWeekKey(d('2026-01-01T00:00:00Z')), '2026-W01');
  assert.equal(isoWeekKey(d('2027-01-01T00:00:00Z')), '2026-W53');
  assert.equal(isoWeekKey(d('2026-11-05T12:00:00Z')), '2026-W45');
});

test('retenção: mantém o mais recente por dia, semana e mês; sempre o último', () => {
  const ids = [];
  for (let day = 0; day < 60; day++) for (const h of [3, 15]) ids.push(makeId(new Date(Date.UTC(2026, 8, 1 + day, h)))); // 2 por dia, 60 dias
  const keep = selectToKeep(ids, { daily: 7, weekly: 4, monthly: 2 });
  const latest = ids.at(-1);
  assert.ok(keep.has(latest));
  // últimos 7 dias → 7 backups (o das 15h de cada dia), nunca o das 03h
  const lastDays = [...keep].filter((id) => id >= makeId(new Date(Date.UTC(2026, 9, 25))));
  assert.ok(lastDays.every((id) => id.slice(9, 11) === '15'));
  assert.ok(keep.size < ids.length / 4);
  assert.ok(keep.size >= 7);
});

test('retenção: poucos backups → mantém todos; vazio → vazio', () => {
  const ids = ['20261101T030000Z', '20261102T030000Z', '20261103T030000Z'];
  assert.equal(selectToKeep(ids).size, 3);
  assert.equal(selectToKeep([]).size, 0);
});

test('retenção: dentro do mesmo dia só fica o mais recente', () => {
  const keep = selectToKeep(['20261105T030000Z', '20261105T150000Z'], { daily: 7, weekly: 1, monthly: 1 });
  assert.deepEqual([...keep], ['20261105T150000Z']);
});

test('parseTimes valida', () => {
  assert.deepEqual(parseTimes('15:30, 03:00,03:00'), ['03:00', '15:30']);
  for (const bad of ['', '24:00', '3:00', '03:60', 'abc']) assert.throws(() => parseTimes(bad));
});

test('nextRun / dueNow', () => {
  const times = ['03:00', '15:00'];
  assert.equal(nextRun(times, d('2026-11-05T02:59:59Z')).toISOString(), '2026-11-05T03:00:00.000Z');
  assert.equal(nextRun(times, d('2026-11-05T03:00:00Z')).toISOString(), '2026-11-05T15:00:00.000Z');
  assert.equal(nextRun(times, d('2026-11-05T16:00:00Z')).toISOString(), '2026-11-06T03:00:00.000Z');
  assert.ok(dueNow(times, d('2026-11-05T15:00:30Z')));
  assert.ok(!dueNow(times, d('2026-11-05T15:01:00Z')));
});

test('planRetention: backups de segurança não deslocam os de rotina do mesmo dia', () => {
  const sets = [
    { id: '20261105T030000Z', trigger: 'schedule' },
    { id: '20261105T101500Z', trigger: 'pre-migrate' },
    { id: '20261105T101900Z', trigger: 'pre-restore' },
  ];
  const keep = planRetention(sets, { daily: 7, weekly: 4, monthly: 6, safety: 5 });
  assert.equal(keep.size, 3); // regressão: antes o pre-restore apagava o backup a restaurar
});

test('planRetention: quota de segurança e nunca remove o mais recente', () => {
  const safe = Array.from({ length: 8 }, (_, i) => ({ id: makeId(new Date(Date.UTC(2026, 10, 1 + i, 10))), trigger: 'pre-migrate' }));
  const keep = planRetention(safe, { safety: 3 });
  assert.equal(keep.size, 3);
  assert.ok(keep.has(safe.at(-1).id));
  assert.deepEqual([...planRetention([], {})], []);
});
