# Arquitetura

## Monorepo

```
apps/api        NestJS 11 + Prisma 6 (prefixo global /api/v1, Swagger em /docs)
  src/auth        registo/login (JWT), Google OAuth opcional
  src/projects    workspaces e projetos
  src/components  Component Builder (definição de campos)
  src/contents    Content Manager (draft/published/archived)
  src/media       Media Library (upload para S3/MinIO)
  src/public-api  API pública (só conteúdo publicado)
  src/common      acesso/ownership, validação de campos, slugs, paginação
apps/frontend   React 18 + Vite + Tailwind (dashboard)
docs/           esta documentação
```

## Modelo de dados

`User → Workspace → Project → Component → ComponentField / ContentEntry` e `Project → MediaAsset`.

- O conteúdo dinâmico fica em `ContentEntry.data` (JSONB), validado contra os `ComponentField` do componente.
- `ContentEntry.status`: `DRAFT | PUBLISHED | ARCHIVED`; só `PUBLISHED` aparece na API pública.
- `slug` é único por componente (`componentId + slug`) e por projeto (`Project.slug`).
- Tipos de campo: text, textarea, richtext, number, boolean, image, file, url, email, date, select, multiselect, reference.

## Fluxos

- **Gestão:** dashboard → API `/api/v1/...` com `Authorization: Bearer <JWT>`; cada recurso é verificado contra o dono do workspace (`AccessService`).
- **Pública:** site do utilizador → `/api/v1/public/{project}/...`, sem autenticação, com CORS por projeto e `Cache-Control: public, max-age=30, stale-while-revalidate=60`.
- **Media:** campos `image`/`file` guardam o id do asset; a API pública converte-o em URL `…/public/{project}/media/{id}`.
