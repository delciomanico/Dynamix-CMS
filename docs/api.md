# Referência da API

Base: `http://localhost:3001/api/v1` · Swagger interativo: `/docs`.

## Paginação

Todas as listagens de conteúdo e media usam o mesmo contrato.

**Pedido**

| Parâmetro | Defeito | Limites |
|---|---|---|
| `page` | `1` | ≥ 1 |
| `limit` | `20` (gestão) / `10` (pública) | 1 – 100 |

Valores inválidos são corrigidos para o defeito/limite mais próximo (não geram erro).

**Resposta**

```json
{
  "data": [ /* itens */ ],
  "meta": { "total": 42, "page": 2, "limit": 20, "pages": 3 }
}
```

Uma página além do fim devolve `data: []` com `meta` correto. A ordenação da gestão é `updatedAt desc` (entries) e `createdAt desc` (media).

> **Mudança de contrato:** `GET /components/:cid/entries` e `GET /projects/:pid/media` devolviam um array simples; agora devolvem `{ data, meta }`.

## Autenticação (gestão)

`POST /auth/register`, `POST /auth/login` → `{ token, user }`. Restantes pedidos: `Authorization: Bearer <token>`. `GET /auth/me`, `GET /auth/google`, `GET /auth/google/callback`.
`POST /auth/change-password` (JWT) → `{ token, user }`; invalida as outras sessões. Registo/login: 10 pedidos/min; alterar password: 5/min; global: 300/min.

`GET /health` (público) → `{ status, db, version, uptime }`; `503` se a BD estiver em baixo.

## Gestão (JWT)

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/workspaces` | Listar / criar workspaces |
| GET/POST | `/workspaces/:wid/projects` | Projetos do workspace |
| GET/PATCH/DELETE | `/projects/:id` | Projeto |
| GET | `/projects/:id/stats` | Contagens |
| GET/POST | `/projects/:pid/components` | Componentes |
| GET/PATCH/DELETE | `/components/:id` | Componente |
| GET 📄 | `/components/:cid/entries?status=&page=&limit=` | Entradas (paginado) |
| POST | `/components/:cid/entries` | Criar `{ data, slug? }` |
| GET/PATCH/DELETE | `/entries/:id` | Entrada |
| POST | `/entries/:id/publish \| unpublish \| archive` | Mudar estado |
| GET 📄 | `/projects/:pid/media?page=&limit=` | Media (paginado) |
| POST | `/projects/:pid/media` | Upload `multipart` (campo `file`, ≤ 10 MB (vídeo mp4/webm ≤ 50 MB); png/jpeg/gif/webp/avif/svg/pdf/txt) |
| DELETE | `/media/:id` | Eliminar |

## Administração (JWT + papel ADMIN)

`GET /admin/overview`, `GET /admin/users` 📄, `GET /admin/projects` 📄, `GET|POST /admin/backups…` — ver [Administração](./admin.md) e [Backups](./backups.md).

## Pública (sem autenticação)

| Rota | Descrição |
|---|---|
| `GET /public/{project}/components` | Estrutura dos componentes |
| `GET /public/{project}/content/{component}` 📄 | Lista publicada |
| `GET /public/{project}/content/{component}/{slug-ou-id}` | Uma entrada |
| `GET /public/{project}/media/{id}` | Ficheiro |

Parâmetros da lista: `page`, `limit`, `sort` (`publishedAt`, `createdAt`, `updatedAt`, `slug`; prefixo `-` = descendente; defeito `-publishedAt`), `q` (pesquisa de texto), `filter[campo]=valor` (só campos do componente).

```bash
curl 'http://localhost:3001/api/v1/public/meu-site/content/posts?page=2&limit=5&sort=-publishedAt&filter[categoria]=news'
```

📄 = paginado.

## Erros

JSON do Nest: `{ "statusCode": 400, "message": "…", "error": "Bad Request" }`. Códigos usuais: 400 validação, 401 sem/invalid token, 404 inexistente (ou de outro utilizador), 429 rate limit.
