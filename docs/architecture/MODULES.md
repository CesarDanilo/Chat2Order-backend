# Módulos

## auth

Login, logout, sessões e o middleware que protege as rotas.

| Rota | Descrição |
|---|---|
| `POST /api/auth/login` | Devolve o token. Limite de 10 erros a cada 15 min por IP |
| `POST /api/auth/logout` | Encerra a sessão atual |

**Exporta:** `authRoutes`, `authMiddleware`, `requireAdmin`, `requireSelfOrAdmin`, `guardRoleChange`.

**Regras:** o token leva um identificador e a versão da senha. Logout revoga o identificador; trocar a senha incrementa a versão e encerra todas as sessões. Conta excluída perde o acesso na hora.

## users

Cadastro e gestão de contas.

| Rota | Quem pode |
|---|---|
| `POST /api/user` | Público, com limite de 10 contas por hora por IP |
| `GET /api/user` | Admin, paginado |
| `GET, PUT, DELETE /api/user/:id` | A própria conta ou admin |

**Regras:** e-mail único sem diferenciar maiúsculas. Só admin altera papel. Admin não remove o próprio acesso. O último admin não pode ser excluído. A senha nunca sai na resposta.

## products

Catálogo de cada conta. `GET`, `POST /api/product` e `GET`, `PUT`, `DELETE /api/product/:id`.

**Regras:** cada conta só vê e altera os próprios produtos. Preço maior que zero, com 2 casas.

## orders

Pedidos. `GET`, `POST /api/order` e `GET`, `PUT`, `DELETE /api/order/:id`.

**Exporta:** `orderRoutes`, `createOrderService`, `PAYMENT_METHODS`, tipo `ImportedOrderInput`.

**Regras, em `domain/`:**

- `orderStatus.ts`: `PENDENTE` vai para `CONCLUIDO` ou `CANCELADO`; `CONCLUIDO` só para `CANCELADO`; `CANCELADO` é final.
- `orderTotals.ts`: totais sempre calculados no servidor, em centavos.
- `orderValues.ts`: listas de status, formas de pagamento e origens.

Cada criação e mudança de status gera histórico. Uma mudança concorrente responde 409.

## parsing

Importação de conversas. `POST /api/parse`, com limite de 20 chamadas a cada 15 min por conta.

**Depende de:** `orders`, para criar o pedido, e `auth`.

**Regras:** a conversa é limpa de caracteres de controle. A resposta da IA é validada, e itens inválidos impedem gravar. A mesma conversa importada pela mesma conta em até 10 minutos devolve o pedido existente. A chamada ao provedor fica isolada em `infrastructure/groqClient.ts`.
