# Administração

Papéis: `USER` (defeito) e `ADMIN`. O admin tem uma visão global da plataforma em **/app/admin** (aparece na barra lateral, secção *Plataforma*).

## O que mostra

- Totais: utilizadores (e novos em 7 dias), admins, workspaces, projetos, componentes, conteúdos por estado, media (nº e tamanho).
- Registos por dia (últimos 30 dias) e projetos com mais conteúdo.
- **Backups** de Postgres e MinIO: estado, lista, "Fazer backup agora" e eliminar (ver [Backups](./backups.md)).
- Tabelas paginadas e pesquisáveis de **utilizadores** e **projetos** (com o dono).

É uma visão só de leitura: o admin vê metadados, não o conteúdo privado dos projetos nem passwords.

## Endpoints (só `ADMIN`)

| Rota | Descrição |
|---|---|
| `GET /admin/overview` | Totais e agregados |
| `GET /admin/users?page&limit&q` | Utilizadores (`q` pesquisa nome/email) |
| `GET /admin/projects?page&limit&q` | Projetos (`q` pesquisa nome/slug) |
| `GET /admin/backups` | Estado e lista de backups (proxy do serviço de backups) |
| `POST /admin/backups/run` | Iniciar um backup (202) |
| `DELETE /admin/backups/:id` | Eliminar um conjunto |

Respostas: `401` sem token, `403` para utilizadores sem papel `ADMIN`.

## Segurança

- O `AdminGuard` consulta o papel na base de dados em cada pedido, não no token: retirar o papel produz efeito imediato.
- O registo e o login Google criam sempre `USER`; o campo `role` enviado no registo é ignorado.
- O primeiro admin vem do [seed](./deploy-dokploy.md#admin-inicial-seed). Para promover outro utilizador: `UPDATE "User" SET role = 'ADMIN' WHERE email = '…';`.
- A verificação no frontend (`AdminOnly`) é só UX; a autorização real está na API.

## Alterar a password

Qualquer utilizador com password (incluindo o admin) em **/app/account** → *Alterar password*, ou `POST /auth/change-password` com `{currentPassword, newPassword}` (5 pedidos/min).

- Mínimo 8 caracteres; **12 para administradores**. Tem de ser diferente da atual.
- Todas as **outras sessões terminam** (os tokens anteriores deixam de ser aceites); a sessão atual recebe um token novo.
- Contas só-Google não têm password.
- O seed do admin (`ADMIN_PASSWORD`) só é usado na criação; reinícios e deploys nunca repõem a password.
