# Segurança

## Versão do Node.js

Em 21 de outubro de 2026 o Node.js publicou um release de segurança (10 CVEs), incluindo um bug no descodificador Brotli (CVE-2026-111497) que permite execução remota de código. Versões corrigidas:

| Linha | Versão mínima |
|---|---|
| 26 | 26.12.1 |
| **24 (LTS usada neste projeto)** | **24.22.1** |
| 22 | 22.23.4 |

Linhas 25, 23, 21, 20 e anteriores estão em fim de vida e **não** recebem correção.

O projeto fixa isto em `.nvmrc` (`24.22.1`) e em `engines.node` (`>=24.22.1`) nos três `package.json`. Ao fazer deploy, reconstruir imagens/containers para apanhar o runtime atualizado. Confirmar com `node -v` e consultar o [anúncio oficial](https://nodejs.org/en/blog/vulnerability) antes de fixar novas versões.

## Modelo de acesso

- API de gestão: JWT + verificação de dono do workspace em cada recurso; CORS só aceita `WEB_URL`.
- API pública: só `PUBLISHED`; CORS por projeto (`allowedOrigins`; vazio = qualquer origem).
- `helmet` ativo; `ValidationPipe` com `whitelist`; rate limit global de 300 req/min.
- Sessões: alterar a password termina as outras sessões; tokens de utilizadores apagados são rejeitados.
- Backups: API interna com token (≥ 16 caracteres), nunca exposta; os ficheiros contêm todos os dados — proteja o volume e o offsite.
- Uploads: lista branca de tipos MIME e limite de 10 MB.

## Checklist de produção

- Definir um `JWT_SECRET` forte e credenciais próprias para Postgres/MinIO.
- Servir por HTTPS e restringir `allowedOrigins` por projeto.
