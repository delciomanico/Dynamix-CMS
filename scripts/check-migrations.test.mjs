import assert from 'node:assert/strict';
import { test } from 'node:test';
import { lintDir, lintSql } from './check-migrations.mjs';

test('migrações aditivas passam', () => {
  assert.deepEqual(lintSql('CREATE TABLE "X" (id TEXT);\nALTER TABLE "User" ADD COLUMN "a" TEXT;\nCREATE INDEX i ON "X"(id);'), []);
  assert.deepEqual(lintSql('ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT \'USER\';'), []);
});
test('bloqueia destrutivas', () => {
  for (const sql of ['DROP TABLE "X";', 'ALTER TABLE "X" DROP COLUMN "a";', 'ALTER TABLE "X" RENAME COLUMN a TO b;',
    'ALTER TABLE "X" ALTER COLUMN "a" TYPE INTEGER;', 'ALTER TABLE "X" ALTER COLUMN "a" SET NOT NULL;', 'DROP TYPE "Role";']) {
    assert.ok(lintSql(sql).length >= 1, sql);
  }
});
test('NOT NULL sem DEFAULT é bloqueado, com DEFAULT não', () => {
  assert.equal(lintSql('ALTER TABLE "X" ADD COLUMN "a" TEXT NOT NULL;').length, 1);
  assert.equal(lintSql('ALTER TABLE "X" ADD COLUMN "a" TEXT NOT NULL DEFAULT \'\';').length, 0);
});
test('allow-destructive com motivo desbloqueia; comentários são ignorados', () => {
  assert.deepEqual(lintSql('-- allow-destructive: coluna já não é usada desde v1.4\nALTER TABLE "X" DROP COLUMN "a";'), []);
  assert.equal(lintSql('-- DROP TABLE x\nSELECT 1;').length, 0);
  assert.equal(lintSql('-- allow-destructive:\nDROP TABLE x;').length, 1); // sem motivo não vale
});
test('as migrações atuais do projeto passam', () => {
  assert.deepEqual(lintDir('apps/api/prisma/migrations'), []);
});
