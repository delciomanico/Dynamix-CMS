#!/usr/bin/env node
// Lint de migrações: bloqueia alterações de esquema que quebram a versão ANTERIOR do código (rollback seguro)
// ou que falham em tabelas com dados. Política "expandir → migrar → contrair" (docs/updates.md).
// Para uma mudança destrutiva intencional (2.ª fase, quando nenhum código a usa), adicionar ao .sql:
//   -- allow-destructive: <motivo>
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  [/\bDROP\s+TABLE\b/i, 'DROP TABLE apaga dados e quebra a versão anterior'],
  [/\bDROP\s+COLUMN\b/i, 'DROP COLUMN quebra a versão anterior (que ainda lê/escreve a coluna)'],
  [/\bRENAME\b/i, 'RENAME quebra a versão anterior — adicione a coluna nova, copie, e só depois remova a antiga'],
  [/\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i, 'mudar o tipo de uma coluna pode falhar com dados e quebra a versão anterior'],
  [/\bSET\s+NOT\s+NULL\b/i, 'SET NOT NULL falha se existirem NULLs e quebra inserts da versão anterior'],
  [/\bDROP\s+TYPE\b/i, 'DROP TYPE quebra a versão anterior'],
];

export function lintSql(sql) {
  if (/--[ \t]*allow-destructive:[ \t]*\S+/i.test(sql)) return [];
  const issues = [];
  const code = sql.replace(/--[^\n]*/g, ''); // ignora comentários
  for (const [re, msg] of RULES) if (re.test(code)) issues.push(msg);
  for (const stmt of code.split(';')) {
    if (/\bADD\s+COLUMN\b/i.test(stmt) && /\bNOT\s+NULL\b/i.test(stmt) && !/\bDEFAULT\b/i.test(stmt)) {
      issues.push('ADD COLUMN ... NOT NULL sem DEFAULT falha em tabelas com dados e quebra inserts da versão anterior');
    }
  }
  return issues;
}

export function lintDir(dir) {
  const problems = [];
  if (!existsSync(dir)) return problems;
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = join(dir, d.name, 'migration.sql');
    if (!existsSync(file)) { problems.push({ migration: d.name, issue: 'migration.sql em falta' }); continue; }
    for (const issue of lintSql(readFileSync(file, 'utf8'))) problems.push({ migration: d.name, issue });
  }
  return problems;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? 'apps/api/prisma/migrations';
  const problems = lintDir(dir);
  for (const p of problems) console.error(`✖ ${p.migration}: ${p.issue}`);
  if (problems.length) { console.error('\nVer docs/updates.md (expandir → migrar → contrair) ou marcar com "-- allow-destructive: motivo".'); process.exit(1); }
  console.log(`✔ migrações seguras (${dir})`);
}
