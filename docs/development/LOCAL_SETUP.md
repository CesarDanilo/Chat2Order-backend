# Como rodar o Chat2Order localmente

Requisitos: Node 22 ou superior e Docker Desktop.

As portas 5434 e 3001 abaixo são as usadas nesta máquina, porque 5433 e 3000 estão ocupadas por outros projetos. Em outra máquina, use a porta que preferir.

## 1. Banco de dados

Em `Chat2Order-backend`:

```bash
docker compose -f docker-compose.local.yml up -d postgres
```

`docker-compose.local.yml` não é versionado. Sem ele, use `docker-compose.dev.yml`, que sobe o Postgres na porta 5433, e ajuste a porta no `.env`.

## 2. Backend

Copie `.env.example` para `.env` e preencha `DATABASE_URL`, `JWT_SECRET` e `PORT`. Depois:

```bash
npm ci
```

```bash
npx prisma generate
```

```bash
npx prisma migrate deploy
```

```bash
npm run dev
```

Documentação da API: http://localhost:3001/docs

`/api/parse` precisa de `GROQ_API_KEY`. Sem ela, a rota responde 502.

## 3. Dados de teste (seed)

```bash
npm run db:seed
```

Cria dados fictícios no banco do `.env`:

| Conta | Papel | Produtos | Pedidos |
|---|---|---|---|
| `dev@chat2order.local` | Admin | 8 | 7 |
| `dev2@chat2order.local` | Usuário comum | 4 | 3 |
| `loja3@chat2order.local` | Usuário comum | 2 | 1 |

Os pedidos cobrem os status `PENDENTE`, `CONCLUIDO` e `CANCELADO`, as duas origens e as quatro formas de pagamento, com itens, histórico de status e registros de IA.

**Senhas.** Nenhuma fica no código. Conta nova usa `SEED_DEV_PASSWORD`, `SEED_DEV2_PASSWORD` ou `SEED_LOJA3_PASSWORD`. Sem a variável, o seed gera uma senha e grava só em `.env.dev-credentials`, que não vai para o Git. Conta existente mantém a senha atual.

**Pode repetir.** Rodar de novo atualiza os mesmos registros, sem duplicar, e as datas são recalculadas a partir de hoje. Só os registros do seed são tocados.

**Proteção.** O seed recusa rodar com `NODE_ENV=production` ou com host de banco diferente de `localhost`, `127.0.0.1`, `[::1]` e `postgres`.

## 4. Frontend

Em `Chat2Order-frontend/frontend`, crie `.env.local` com a URL do backend. Esse arquivo não é versionado.

```bash
VITE_API_URL=http://127.0.0.1:3001
```

Depois:

```bash
npm ci
```

```bash
npm run dev
```

Acesse http://localhost:5173

## 5. Extensão

Em `chat2order-frontend-extension/frontend`, crie `.env.local`:

```bash
VITE_API_URL="http://127.0.0.1:3001/api"
```

Depois rode `npm ci` e `npm run build`. No Chrome, abra `chrome://extensions`, ative o modo do desenvolvedor, clique em **Carregar sem compactação** e selecione a pasta `dist`.

O backend só aceita extensões com ID conhecido. Copie o ID em `chrome://extensions` e adicione ao `.env` do backend:

```bash
EXTENSION_ORIGINS=chrome-extension://<id-de-32-letras>
```

O ID de uma extensão descompactada depende da pasta. Para produção, use o ID publicado na loja.

## 6. Testes do backend

Copie `.env.test.example` para `.env.test` e ajuste a porta. O banco de testes é criado sozinho e precisa ter nome terminado em `_test`, porque a suíte apaga os dados dele antes de rodar.

| Comando | O que faz |
|---|---|
| `npm test` | Roda tudo |
| `npm run test:unit` | Só unitários, sem banco |
| `npm run test:api` | Só API, com banco de testes |
| `npm run typecheck` | Checagem de tipos |

## 7. Testes E2E

No frontend, copie `.env.e2e.example` para `.env.e2e` e preencha com as contas do seed. Com backend e frontend rodando:

```bash
npm run test:e2e
```

A suíte consome parte do limite de requisições do backend. Reinicie o backend entre execuções seguidas.
