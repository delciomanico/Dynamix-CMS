# Dynamix-CMS

Transforma websites estáticos em dinâmicos, sem reconstruir o frontend. Ver [visão geral e arquitetura](./Dynamix-CMS-Visao-Geral-e-Arquitetura.md).

| Camada | Tecnologia |
|---|---|
| Frontend (`apps/frontend`) | React 18 + React Router 6 + Vite + Tailwind |
| API (`apps/api`) | NestJS 11 + Prisma 6 + Swagger |
| Base de dados | PostgreSQL 16 (conteúdo dinâmico em JSONB) |
| Ficheiros | `pgsty/minio` (fork comunitário do MinIO) via API S3 |

## Documentação

Ver [`docs/`](./docs/README.md): primeiros passos, arquitetura, referência da API (incl. paginação) e segurança.

## Deploy

Produção no Dokploy: [`docs/deploy-dokploy.md`](./docs/deploy-dokploy.md). Backups automáticos: [`docs/backups.md`](./docs/backups.md). Atualizações automáticas e seguras (CI/CD, rollback): [`docs/updates.md`](./docs/updates.md).

## Arranque

Tudo em Docker: `docker compose up -d --build` → frontend em :5173, API em :3001.

Ou em modo desenvolvimento:

Requer **Node ≥ 24.22.1** (`nvm use`) — inclui as correções de segurança de outubro de 2026.

```bash
npm run infra                                   # Postgres + MinIO (consola em :9001)
cd apps/api && cp .env.example .env && npm i && npx prisma migrate dev && cd ../..
cd apps/frontend && cp .env.example .env && npm i && cd ../..
npm run api    # http://localhost:3001  (Swagger em /docs)
npm run web    # http://localhost:5173
```

Login com Google é opcional: preencher `GOOGLE_CLIENT_ID/SECRET` em `apps/api/.env`
(callback: `{API_PUBLIC_URL}/api/v1/auth/google/callback`).

## API pública (só conteúdos publicados)

```
GET /api/v1/public/{project}/components
GET /api/v1/public/{project}/content/{component}?page&limit&sort=-publishedAt&q=&filter[campo]=valor
GET /api/v1/public/{project}/content/{component}/{slug}
GET /api/v1/public/{project}/media/{id}
```

CORS por projeto (Settings → domínios autorizados; vazio = qualquer origem). A API de gestão exige JWT e aceita apenas a origem do dashboard.

## Seeds de sites

No arranque (`predeploy`) o Dynamix cria, de forma idempotente, o admin e os sites listados em `SEED_SITES`
(defeito `bchiwale`): projeto + componentes + conteúdo publicado, com os endpoints públicos prontos.
Ver [`docs/seeds.md`](./docs/seeds.md).

## Âmbito do MVP

Implementado: auth (email+password, Google opcional), workspaces/projetos, Component Builder (13 tipos de campo),
Content Manager (draft/published/archived), Media Library (MinIO), API pública com filtros/paginação/cache/rate limit,
Integration Guide, Swagger, isolamento por utilizador.
Fora (P1/P2): API keys, equipas, analytics, versionamento, Redis.
