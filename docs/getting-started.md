# Primeiros passos

## Requisitos

- **Node.js ≥ 24.22.1** (ver [Segurança](./security.md#versão-do-nodejs)). O ficheiro `.nvmrc` fixa a versão: `nvm use`.
- Docker (PostgreSQL 16 + MinIO)

## Tudo em Docker (recomendado)

```bash
docker compose up -d --build     # postgres, minio, api e frontend
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API / Swagger | http://localhost:3001/api/v1 · http://localhost:3001/docs |
| Consola MinIO | http://localhost:9001 (`dynamix` / `dynamix-secret`) |

O serviço one-shot `migrate` aplica as migrações (com backup prévio se houver dados) e o seed antes de a API arrancar; a API cria o bucket. O serviço `backup` faz backups automáticos (ver [Backups](./backups.md)). Ambas as imagens usam `node:24.22.1`. O `VITE_API_URL` do frontend é fixado no **build** (`build.args` no compose). `JWT_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` são lidos do ambiente/`.env` da raiz. Parar: `docker compose down` (`-v` apaga os dados).

## Instalação local (sem containers para a app)

Só a infraestrutura em Docker: `docker compose up -d postgres minio`.

```bash
npm run infra                                   # Postgres :5432 + MinIO :9000 (consola :9001)
cd apps/api && cp .env.example .env && npm i && npx prisma migrate dev && cd ../..
cd apps/frontend && cp .env.example .env && npm i && cd ../..
npm run api    # http://localhost:3001  (Swagger em /docs)
npm run web    # http://localhost:5173
```

Para criar um admin no ambiente local, define `ADMIN_EMAIL` e `ADMIN_PASSWORD` (≥ 12 caracteres) num `.env` na raiz antes do `docker compose up`. Produção: ver [Deploy no Dokploy](./deploy-dokploy.md).

## Scripts

| Comando (raiz) | Ação |
|---|---|
| `npm run infra` | Sobe Postgres e MinIO (sem api/frontend) |
| `npm run api` | API em modo watch |
| `npm run web` | Frontend (Vite) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm test` | Testes da API (Jest), do serviço de backups e do lint de migrações — sem necessidade de BD |
| `npm run check:migrations` | Lint de migrações (seguras para rollback) |
| `npm run backup:run` / `backup:list` | Backup manual / listar backups |

Em produção: `npm --prefix apps/api run build && npm --prefix apps/api run prisma:deploy && npm --prefix apps/api start`.

## Variáveis de ambiente

**API** (`apps/api/.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta da API (3001) |
| `DATABASE_URL` | Ligação PostgreSQL |
| `BACKUP_URL` / `BACKUP_TOKEN` | Serviço de [backups](./backups.md) (painel admin e backup pré-migração) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Segredo e validade dos tokens — **alterar em produção** |
| `WEB_URL` | Origem do dashboard (única aceite pela API de gestão via CORS) |
| `API_PUBLIC_URL` | URL pública da API (usada para gerar URLs de media) |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Armazenamento S3/MinIO |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seed do admin inicial (ver [Administração](./admin.md)) |
| `TRUST_PROXY_HOPS` | Nº de proxies confiáveis à frente da API (defeito 0) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Opcional. Callback: `{API_PUBLIC_URL}/api/v1/auth/google/callback` |

**Frontend** (`apps/frontend/.env`): `VITE_API_URL` (ex.: `http://localhost:3001/api/v1`).
