# Deploy no Dokploy

Usa `docker-compose.prod.yml`: imagens pré-construídas pelo CI (ver [Atualizações](./updates.md)), sem portas no host (o Traefik do Dokploy encaminha o domínio). O serviço `frontend` (nginx) serve o site e faz proxy de `/api` e `/docs` para a API, por isso **um único domínio** serve tudo e não há CORS entre origens.

## Passos

1. **Create Service → Compose** e ligar ao repositório Git (branch `main`).
2. **Compose Path:** `./docker-compose.prod.yml` · **Compose Type:** Docker Compose · **Auto Deploy: desligado** (o CI faz o deploy depois dos testes).
3. **Environment:** colar as variáveis de [`.env.production.example`](../.env.production.example) com valores reais. Gerar segredos com `openssl rand -hex 32`.
4. **Domains:** adicionar o domínio → *Service Name* `frontend`, *Port* `80`, HTTPS com Let's Encrypt. O `PUBLIC_URL` tem de ser exatamente esse domínio (`https://…`, sem barra final).
5. **Deploy.** O serviço `migrate` faz backup (se há migrações pendentes), aplica-as e corre o seed; só depois a API arranca.

**Sem registry/CI (alternativa simples):** no Dokploy use o comando de deploy personalizado `docker compose -f docker-compose.prod.yml -f docker-compose.build.yml up -d --build` — constrói no servidor, sem rollback automático.

## Variáveis

| Variável | Obrigatória | Notas |
|---|---|---|
| `PUBLIC_URL` | sim | Domínio público. Define `WEB_URL` (CORS do dashboard) e `API_PUBLIC_URL` (URLs de media) |
| `POSTGRES_PASSWORD` | sim | Usar hex: entra num URL de ligação |
| `JWT_SECRET` | sim | ≥ 32 caracteres. Mudá-lo invalida todas as sessões |
| `S3_SECRET_KEY` | sim | Password do MinIO |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | sim | Admin inicial (ver abaixo) |
| `BACKUP_TOKEN` | sim | ≥ 16 caracteres; liga a API ao serviço de [backups](./backups.md) |
| `IMAGE_TAG`, `IMAGE_PREFIX` | não | Tag/registry das imagens (defeito `latest`, `ghcr.io/delciomanico/dynamix-cms`) |
| `BACKUP_TIMES`, `BACKUP_OFFSITE`, `RCLONE_CONFIG_OFFSITE_*` | não | Horário e cópia externa dos backups |
| `ADMIN_NAME`, `S3_ACCESS_KEY`, `S3_BUCKET`, `JWT_EXPIRES_IN` | não | Têm defeitos |
| `GOOGLE_CLIENT_ID/SECRET` | não | Callback: `{PUBLIC_URL}/api/v1/auth/google/callback` |

O compose falha com mensagem clara se faltar uma obrigatória.

## Admin inicial (seed)

`dist/seed.js` corre em **cada arranque** da API, depois das migrações, e é idempotente:

| Situação | Resultado |
|---|---|
| `ADMIN_EMAIL` não existe | Cria utilizador `ADMIN` com a password dada (bcrypt) e um workspace |
| Já existe como `USER` | Promove a `ADMIN`; **não** altera a password |
| Já é `ADMIN` | Nada |
| `ADMIN_PASSWORD` < 12 caracteres | Falha o arranque (fail fast) |

Depois do primeiro login, altere a password em **/app/account**; o seed nunca a sobrescreve (nem repõe em reinícios). Não há endpoint público para criar admins: o registo cria sempre `USER`.

## Persistência e operação

- Volumes `pgdata`, `miniodata` e `backups`. Os backups automáticos estão em [Backups](./backups.md); configure o **offsite** (os locais ficam no mesmo servidor).
- Nem o Postgres nem o MinIO são expostos publicamente.
- Healthcheck da API em `/api/v1/health`; o frontend só arranca depois de a API estar `healthy`.
- `TRUST_PROXY_HOPS=2` (Traefik + nginx) faz o rate limit usar o IP real do cliente. Se alterares a cadeia de proxies, ajusta este valor.
- Upload máximo: 10 MB (nginx aceita até 11 MB).

## Testar localmente

```bash
cp .env.production.example /tmp/prod.env   # preencher; IMAGE_PREFIX=dynamix-cms, IMAGE_TAG=local
docker compose -f docker-compose.prod.yml -f docker-compose.build.yml --env-file /tmp/prod.env up -d --build
```
(sem portas publicadas; para aceder, acrescentar um override com `frontend.ports: ["8080:80"]`). Depois: `scripts/smoke.sh http://localhost:8080 local`.
