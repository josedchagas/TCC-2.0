# Segurança e sessão anônima

## Configuração local

1. Copie `.env.example` para `.env` e preencha `DATABASE_URL` e `JWT_SECRET`.
2. Na pasta `Back-End`, execute `npm install`.
3. Aplique as alterações do schema no banco existente com `npm run db:push` depois de conferir o diff apresentado pelo Drizzle.
4. Execute `npm run dev`.
5. Na pasta `Front-End`, defina opcionalmente `VITE_API_URL=http://localhost:3000` em `.env` e execute `npm install` e `npm run dev`.

O front-end usa cookies de sessão `HttpOnly` e `credentials: include`. A origem do front-end deve estar listada em `FRONTEND_ORIGIN`. Em produção com front-end/API em sites diferentes, configure `COOKIE_SAME_SITE=none`, HTTPS e `NODE_ENV=production`.

## Conta anônima

`POST /auth/guest` cria um usuário anônimo na primeira visita e reutiliza o usuário identificado pelo cookie `rpg_session` em chamadas futuras do mesmo navegador. A sessão anônima dura até 1 ano e é renovada a cada visita; a sessão de conta convencional dura 7 dias. Limpar os dados do navegador ou trocar de dispositivo pode tornar o progresso anônimo irrecuperável; futuramente pode ser adicionada uma opção de vincular a conta a e-mail/senha.

## Permissão administrativa

Todos os usuários novos recebem `role = 'player'`. Depois de criar a conta que será administradora, promova-a manualmente pelo console SQL do banco:

```sql
UPDATE users SET role = 'admin' WHERE email = 'seu-email-de-administrador@example.com';
```

Não exponha uma rota pública para mudar `role`. As rotas `POST /items`, `PUT /items/:id` e `DELETE /items/:id` consultam o papel atual no banco.

## Progressão

`PUT /saves/:id` só aceita `characterName`. A criação do save recebe `slotNumber` e `characterId`; os atributos e valores iniciais são gerados no servidor. A ação `POST /saves/:id/actions/spend-point` consome um ponto disponível e incrementa um atributo até 20.

Ainda é necessário implementar no servidor as regras de combate, recompensas, ganho de XP, moedas, recuperação de vida/energia e avanço de capítulo antes de habilitar essas mudanças pela API. Não aceite quantidades de recompensa enviadas livremente pelo navegador.
