# Seeds de sites

Quando o Dynamix arranca (serviço one-shot `migrate` → `node dist/predeploy.js`, ou `npm run seed` em `apps/api`):

1. `prisma migrate deploy`
2. seed do **admin** (`ADMIN_EMAIL` / `ADMIN_PASSWORD`)
3. seed dos **sites** em `SEED_SITES` (lista separada por vírgulas; defeito `bchiwale`; `none` desativa)

## O que o seed do `bchiwale` cria

Projeto `bchiwale` no workspace do admin, com 8 componentes e todo o conteúdo do site já **publicado**:

| Componente | Conteúdo | Endpoint |
|---|---|---|
| `services` | 7 serviços (metodologia, normas, FAQs) | `/api/v1/public/bchiwale/content/services` |
| `team` | equipa | `…/content/team` |
| `portfolio` | projetos | `…/content/portfolio` |
| `blog` | artigos | `…/content/blog` |
| `gallery` | galeria | `…/content/gallery` |
| `testimonials` | testemunhos | `…/content/testimonials` |
| `jobs` | vagas | `…/content/jobs` |
| `settings` | menu, rodapé, estatísticas, contactos, banners… (slug = chave, com `_`→`-`) | `…/content/settings` |

Mais `GET /api/v1/public/bchiwale/components` (estrutura) e `…/content/{componente}/{slug}`.
Campos bilingues são pares `*_pt` / `*_en`; estruturas aninhadas usam o tipo de campo `json`.
**Imagens, vídeo e logos** (≈ 40 ficheiros, 29 MB em `apps/api/seed-assets/bchiwale/`) são carregados para a **Media Library** (MinIO) e servidos por `/api/v1/public/bchiwale/media/{id}` (com suporte a `Range`, necessário para o vídeo). Campos do tipo `image` guardam o id; em campos `json` (definições, galerias…) escreve-se `media://<id>` e a API pública converte em URL — o botão "Copiar media://" da Media Library dá a referência. O componente `settings` inclui `site_images` (logo, ícone, fundos dos cabeçalhos das páginas, retrato do DG) e `about_video`. O MinIO tem de estar acessível durante o seed (o serviço `migrate` depende dele).

**Ordem:** a API pública só ordena por data, por isso o seed grava `publishedAt` crescente e o site pede `sort=publishedAt`.

## Garantias

- **Idempotente e não destrutivo.** Projeto existente não é tocado; componente existente só ganha campos novos em falta; o **conteúdo nunca é reescrito** (edições no dashboard sobrevivem a novos deploys). Só se semeia o conteúdo de um componente quando o componente é criado nessa execução.
- Precisa de `ADMIN_EMAIL` definido (o admin é o dono do projeto). Sem ele, o seed de sites é ignorado.
- Variáveis: `SEED_BCHIWALE_ORIGINS` (CORS da API pública, separado por vírgulas; vazio = qualquer origem) e `SEED_BCHIWALE_URL`.

## Atualizar os dados do seed

Os dados e ficheiros vêm de `apps/api/src/seeds/bchiwale/data.json`, gerado a partir do site:

```bash
cd ../bchiwale && node scripts/export-dynamix-seed.mjs   # gera data.json e copia os ficheiros referenciados
```

A definição dos campos está em `apps/api/src/seeds/bchiwale/definition.ts`. Para adicionar outro site, criar uma pasta análoga e registá-la em `SITE_SEEDS` (`seeds/site-seed.ts`).

## Ligar o site

No site (`bchiwale`) definir `VITE_DYNAMIX_API_URL=https://<dominio-do-dynamix>/api/v1` e `VITE_DYNAMIX_PROJECT=bchiwale` (build-time).
