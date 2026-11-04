# Atualizações seguras em produção

Objetivo: cada alteração ao código chega a produção **automaticamente depois de passar nos testes**, e uma versão má **não danifica dados nem fica no ar**.

```
push/merge em main
   │
   ▼
1. TESTES (bloqueiam tudo)    tipos, testes API/backup/scripts, build do frontend,
   │                          lint de migrações, migrações numa BD vazia, sem drift schema↔migrações
   ▼
2. IMAGENS imutáveis          api / frontend / backup → ghcr.io/<owner>/dynamix-cms-*:<sha do commit>
   ▼
3. DEPLOY                     :latest → <sha>; pede deploy ao Dokploy (pull das imagens novas)
   │   no servidor, serviço one-shot `migrate`:
   │     migrações pendentes? → BACKUP (Postgres+MinIO) → prisma migrate deploy → seed
   │     backup falhou? → deploy ABORTADO, a versão atual continua a servir
   ▼
4. SMOKE TEST                 /api/v1/health = ok, db up, versão == <sha>, frontend 200
   │
   ├─ OK  → fim
   └─ FALHOU → ROLLBACK automático: :latest → versão anterior, redeploy, smoke test; o workflow fica vermelho
```

## Regras que tornam isto seguro

1. **Migrações compatíveis com a versão anterior ("expandir → migrar → contrair")**. Como o rollback põe código antigo a falar com a BD nova, uma migração nunca pode partir o código anterior:
   - ✅ criar tabelas/colunas anuláveis ou com `DEFAULT`, criar índices.
   - ❌ `DROP`, `RENAME`, mudar tipo, `SET NOT NULL`, `ADD COLUMN … NOT NULL` sem `DEFAULT`.
   - Para remover/renomear algo: **release N** adiciona o novo e passa a usá-lo; **release N+1** (quando nada usa o antigo) remove-o, com `-- allow-destructive: <motivo>` no `.sql`.
   - `node scripts/check-migrations.mjs` (CI) bloqueia o resto.
2. **Nunca editar uma migração já aplicada**; criar uma nova. O CI falha se `schema.prisma` e as migrações divergirem.
3. **Backup antes de migrar**, com falha ⇒ aborta (`PREDEPLOY_BACKUP=required` em produção).
4. **Imagens imutáveis por SHA**: o que foi testado é exatamente o que corre. Rollback = repor uma tag antiga.
5. **Versão visível**: `GET /api/v1/health` devolve `{status, db, version}`; é o que o smoke test e o healthcheck usam.

## Configurar (uma vez)

**GitHub** (Settings → Environments → `production`; opcionalmente exigir aprovação manual):

| Tipo | Nome | Valor |
|---|---|---|
| Variable | `PROD_URL` | `https://cms.exemplo.com` — **o deploy automático só corre se existir** |
| Secret | `DOKPLOY_URL` | URL do painel Dokploy |
| Secret | `DOKPLOY_API_KEY` | Dokploy → Profile → API/CLI → gerar chave |
| Secret | `DOKPLOY_COMPOSE_ID` | ID do serviço Compose |

Recomendado: *branch protection* em `main` com o job `test` obrigatório (também necessário para o auto-merge do Dependabot).

**Dokploy**: serviço Compose com `docker-compose.prod.yml`, **Auto Deploy desligado** (quem decide é o CI, só depois dos testes). O servidor precisa de aceder às imagens: torne os pacotes GHCR públicos ou faça `docker login ghcr.io` no servidor com um token `read:packages`. Variáveis: ver [Deploy no Dokploy](./deploy-dokploy.md).

> Verifique o endpoint de deploy no Swagger da sua instância Dokploy (`/swagger`): o pedido usado no workflow é `POST /api/compose.deploy` com `x-api-key` e `{"composeId": "…"}`. Se a sua versão diferir, ajuste só esse passo em `.github/workflows/ci-cd.yml`.

## Dependências e imagens base

Dependabot (semanal) abre PRs para npm, imagens Docker (inclui o Node: correções de segurança) e GitHub Actions. Patch/minor entram sozinhos **se o CI passar**; major ficam para revisão humana.

## Rollback manual

- **Código**: em Dokploy defina `IMAGE_TAG=<sha anterior>` e faça redeploy (ou re-execute o workflow do commit bom). Funciona porque as migrações são compatíveis.
- **Dados** (migração errada/corrupção): [restaurar o backup](./backups.md#restaurar) `pre-migrate` criado nesse deploy.

## Limitações conhecidas

- Dokploy em modo Compose recria o container da API: há **alguns segundos de indisponibilidade** por deploy (o frontend devolve 502 em `/api` nesse intervalo). Para zero-downtime a sério seria preciso Docker Swarm com `update_config: order: start-first` (modo Stack do Dokploy, que não suporta `build:`/`depends_on`) ou balanceador com duas réplicas — não implementado.
- Após o rollback automático a BD mantém as migrações novas (por design). Por isso a regra 1 é obrigatória.
- Se não houver versão anterior válida (1.º deploy) não há rollback automático; o workflow falha e o backup/estado antigo mantêm-se.
- O workflow `.github/workflows/ci-cd.yml` e a chamada ao Dokploy **não foram executados** num GitHub/Dokploy reais: valide com um push de teste (com `PROD_URL` por definir, corre só testes e build das imagens).
