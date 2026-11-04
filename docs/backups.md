# Backups

Serviço `backup` (pasta `apps/backup`, container próprio) que protege **PostgreSQL** e **MinIO** em conjunto.

## O que faz

| | |
|---|---|
| **O quê** | Cada backup é um *conjunto*: `pg_dump` (formato custom) + `tar.gz` do bucket MinIO + `json` com tamanhos e SHA-256. O `json` é escrito por último: sem ele o conjunto é considerado incompleto e ignorado |
| **Quando** | Automático nas horas `BACKUP_TIMES` (UTC, defeito `03:00`), 20 s após o 1.º arranque se ainda não houver nenhum nas últimas 24 h, e **antes de cada migração de base de dados** (ver [Atualizações](./updates.md)) |
| **Verificação** | Em cada backup: `pg_restore --list`, `tar tzf` e checksum. Um backup que não verifica não é registado |
| **Retenção** | Mantém o mais recente de cada um dos últimos 7 dias, 4 semanas e 6 meses (`BACKUP_KEEP_DAILY/WEEKLY/MONTHLY`). Os backups de segurança (`pre-migrate`, `pre-restore`) têm quota própria (`BACKUP_KEEP_SAFETY`, 5). Só se apaga depois de um backup bem-sucedido |
| **Offsite** | Opcional, qualquer destino do [rclone](https://rclone.org/) (S3, R2, B2, SFTP…). Falha offsite não invalida o backup local, mas fica visível no painel |

> Os backups locais ficam no volume `backups`, **no mesmo servidor** — não protegem contra perda do servidor. Configure o offsite.

## Gerir pelo painel

**/app/admin → Backups** (só admin): estado do último e do próximo backup, espaço usado, lista de conjuntos, **Fazer backup agora** e **Eliminar**. Falhas do último backup aparecem a vermelho.

O restauro **não** está no painel, de propósito (operação destrutiva).

## Gerir pela linha de comandos

```bash
docker compose exec backup node src/backup.mjs list                    # ou: npm run backup:list
docker compose exec backup node src/backup.mjs run --label "antes da campanha"   # npm run backup:run
docker compose exec backup node src/backup.mjs verify [--id ID]       # reverifica checksums
docker compose exec backup node src/backup.mjs prune --dry-run        # o que a retenção apagaria
docker compose exec backup node src/backup.mjs delete --id ID
docker compose exec backup node src/backup.mjs status
```
Em produção acrescente `-f docker-compose.prod.yml` (ou use o terminal do serviço no Dokploy).

## Restaurar

```bash
docker compose exec backup node src/backup.mjs list                    # escolher o ID
docker compose stop api                                                # evita escritas durante o restauro
docker compose exec backup node src/backup.mjs restore --id <ID>       # mostra o que vai fazer e sai
docker compose exec backup node src/backup.mjs restore --id <ID> --yes
docker compose start api
```
- `--only db` ou `--only media` restaura só uma parte.
- Antes de substituir, é criado um backup `pre-restore` (desligar: `--no-safety`), para o restauro ser reversível.
- A BD é restaurada numa única transação: se falhar, fica como estava. O MinIO é espelhado (`rclone sync`): ficheiros que não existiam no backup são removidos.
- Se o conjunto já não existir localmente mas existir offsite, é descarregado automaticamente.
- **Teste o restauro** num ambiente de teste de vez em quando: um backup nunca restaurado não é garantia.

## Configuração

| Variável | Defeito | |
|---|---|---|
| `BACKUP_TOKEN` | — (obrigatório em produção, ≥ 16) | Autentica a API ↔ serviço de backups (rede interna) |
| `BACKUP_TIMES` | `03:00` | Horas UTC separadas por vírgula, ex. `03:00,15:00` |
| `BACKUP_KEEP_DAILY/WEEKLY/MONTHLY/SAFETY` | `7/4/6/5` | Retenção |
| `BACKUP_OFFSITE` | vazio | Destino rclone, ex. `offsite:meu-bucket/dynamix` |
| `RCLONE_CONFIG_OFFSITE_*` | vazio | Credenciais do destino (ver exemplo em `.env.production.example`) |

Exemplo offsite (Cloudflare R2 / S3 compatível):
```
BACKUP_OFFSITE=offsite:meu-bucket/dynamix
RCLONE_CONFIG_OFFSITE_TYPE=s3
RCLONE_CONFIG_OFFSITE_PROVIDER=Cloudflare
RCLONE_CONFIG_OFFSITE_ENDPOINT=https://<conta>.r2.cloudflarestorage.com
RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID=...
RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY=...
```

## Segurança

A API de controlo (porta 8081) só existe na rede interna do Docker e exige `Authorization: Bearer $BACKUP_TOKEN`; sem token válido (≥ 16 caracteres) fica desativada. O browser nunca a vê: o painel fala com a API de administração, que valida o papel ADMIN e faz proxy. Os ficheiros de backup contêm **todos os dados** (incluindo hashes de passwords): proteja o volume e o destino offsite.
