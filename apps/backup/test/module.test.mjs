import assert from 'node:assert/strict';
import { test } from 'node:test';

test('backup.mjs carrega sem erros e expõe a API esperada', async () => {
  const m = await import('../src/backup.mjs');
  for (const fn of ['runBackup', 'prune', 'restore', 'verifySet', 'listSets', 'getStatus', 'removeSet']) assert.equal(typeof m[fn], 'function', fn);
});
