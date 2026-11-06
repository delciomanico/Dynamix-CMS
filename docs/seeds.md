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
| `ui-texts` | todos os textos fixos da interface (botões, títulos, rótulos, SEO) em PT/EN, ~450 entradas; campo `key` (ex. `nav.home`), `*palavra*` = destaque em itálico | `…/content/ui-texts` |
| `hero-slides` | Home · Banner principal (imagem, títulos, botões) | `…/content/hero-slides` |
| `stats` | Home · Números | `…/content/stats` |
| `timeline` | Sobre · História | `…/content/timeline` |
| `mvv` | Sobre · Missão, Visão e Valores | `…/content/mvv` |
| `org-chart` | Sobre · Organograma (cada cargo com `parent` = slug do superior) | `…/content/org-chart` |
| `certifications`, `cert-badges` | Sobre · Certificações; Rodapé · Selos | `…/content/certifications` |
| `footer-links` | Rodapé · Links (grupo `servicos` / `empresa`) | `…/content/footer-links` |
| `contact-info` | Empresa · Contactos (1 entrada) | `…/content/contact-info` |
| `filters` | Site · Filtros e categorias (galeria, blog, portfolio, vagas) | `…/content/filters` |
| `downloads`, `tools` | Recursos · Downloads e Ferramentas | `…/content/downloads` |
| `site-media` | Site · Imagens e vídeo (logo, favicon, cabeçalhos, retrato do DG, menus, vídeo; o slug é a chave) | `…/content/site-media` |

Mais `GET /api/v1/public/bchiwale/components` (estrutura) e `…/content/{componente}/{slug}`.
Campos bilingues são pares `*_pt` / `*_en`; estruturas aninhadas usam o tipo de campo `json`.
**Imagens, vídeo e logos** (≈ 40 ficheiros, 29 MB em `apps/api/seed-assets/bchiwale/`) são carregados para a **Media Library** (MinIO) e servidos por `/api/v1/public/bchiwale/media/{id}` (com suporte a `Range`, necessário para o vídeo). Campos do tipo `image` guardam o id; em campos `json` (galerias…) escreve-se `media://<id>` e a API pública converte em URL — o botão "Copiar media://" da Media Library dá a referência. O componente `site-media` (campo `file`) guarda o logo, o ícone, os fundos dos cabeçalhos das páginas, o retrato do DG, as imagens dos menus e o vídeo. O MinIO tem de estar acessível durante o seed (o serviço `migrate` depende dele).

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

## Encontrar e editar muitos conteúdos

Na lista de conteúdos de um componente há **pesquisa** (slug e todos os valores, sem distinguir maiúsculas) e **filtros por secção**. A secção vem do campo `section` ou `group` do conteúdo ou, se não existir, do prefixo do campo `key` (`nav.home` → `nav`). Cada linha mostra uma prévia do primeiro texto longo. API: `GET /components/:id/entries?q=…&section=…&sort=slug` e `GET /components/:id/sections`.
