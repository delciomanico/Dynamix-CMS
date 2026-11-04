/**
 * Seed idempotente — corre em cada arranque (depois de `prisma migrate deploy`).
 * Cria o administrador inicial a partir de ADMIN_EMAIL / ADMIN_PASSWORD.
 * - Utilizador não existe  → cria com role ADMIN (+ workspace).
 * - Utilizador já existe   → garante role ADMIN, NUNCA altera a password.
 * - Variáveis em falta     → avisa e sai com sucesso (a API arranca na mesma).
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient, env: NodeJS.ProcessEnv = process.env) {
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email || !password) return 'skipped' as const;
  if (password.length < 12) throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres');

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== 'ADMIN') await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
    return existing.role === 'ADMIN' ? ('unchanged' as const) : ('promoted' as const);
  }
  const name = env.ADMIN_NAME?.trim() || 'Administrador';
  await prisma.user.create({
    data: {
      name, email, role: 'ADMIN',
      passwordHash: await bcrypt.hash(password, 12),
      workspaces: { create: { name: `${name} — Workspace` } },
    },
  });
  return 'created' as const;
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const r = await seedAdmin(prisma);
    console.log(
      r === 'skipped' ? '[seed] ADMIN_EMAIL/ADMIN_PASSWORD não definidos — admin não criado'
        : `[seed] admin: ${r}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((e) => { console.error('[seed] falhou:', e.message); process.exit(1); });
}
