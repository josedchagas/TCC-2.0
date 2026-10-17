# Campanha: A Vila Esquecida

A campanha tem 20 capítulos, cada um com narrativa, objetivo, dois encontros regulares/elite e um chefe. A vitória sobre o chefe avança a história; o chefe final marca a campanha como concluída.

## Rotas novas

- `GET /game/campaign` — títulos, história, objetivos e disponibilidade de loja.
- `GET /game/chapters/:chapterNumber` — capítulo completo com seus inimigos.
- `GET /game/items` — catálogo de itens, raridades, preços, efeitos e bônus.
- `GET /game/shops/:chapterNumber` — estoque da loja dos capítulos 5, 10, 15 e 20.
- `GET /saves/:saveId/encounters/defeated` — inimigos já derrotados naquele save.
- `POST /saves/:saveId/battle/:enemyId/resolve` — resolve o encontro no servidor, entrega XP/dinheiro e tenta conceder drops.
- `POST /saves/:saveId/shop/purchase` — compra um item disponível na loja do capítulo atual. Corpo: `{ "itemCode": "pocao_vida", "quantity": 1 }`.
- `POST /saves/:saveId/inventory/:inventoryId/use` — consome uma poção e aplica seus efeitos no servidor.

## Economia e progressão

- A recompensa em moedas e XP é definida individualmente por inimigo em `src/game/content.js`.
- Os chefes dão recompensas maiores e possuem drops especiais.
- As lojas só ficam disponíveis nos capítulos 5, 10, 15 e 20; o servidor verifica capítulo e estoque, não confia no preço enviado pelo cliente.
- O inventário tem oito espaços e pilhas de até 99 unidades.
- O inimigo derrotado é registrado por save, impedindo repetir a recompensa do mesmo encontro no mesmo save.
- A cada nível são concedidos três pontos de atributo; o limite individual de atributo continua sendo 20.

## Aplicação no banco

Depois de atualizar o código, execute `npm run db:push` na pasta `Back-End` e revise o plano do Drizzle antes de confirmar. Isso adiciona o indicador de campanha concluída e a tabela de encontros derrotados. Ao iniciar, o servidor atualiza saves antigos com valores de vida/energia compatíveis e `chapterMax = 20`.
