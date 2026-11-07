# Padrões de validação do Chat2Order

## Camadas

| Camada | Papel | Não faz |
|---|---|---|
| Frontend e extensão | Orientar o usuário e evitar envios inúteis | Garantir segurança |
| Backend | Validar toda entrada, autorização e regras de negócio | Confiar no cliente |
| Banco | Última barreira contra valores impossíveis | Substituir a aplicação |

Validação no navegador é só experiência de uso. Toda regra de segurança precisa existir no backend.

## Onde cada regra fica

| O que | Onde |
|---|---|
| Schemas e limites | `src/modules/<módulo>/presentation/*.schema.ts` e `src/shared/validation/` |
| Aplicar o schema | `validate()` em `src/shared/http/validate.ts` |
| Autorização | `src/modules/auth/presentation/authMiddleware.ts` e repositórios, que exigem `ownerId` |
| Regras de negócio | `domain/` e `application/` de cada módulo |
| Ambiente | `src/app/config/env.ts` |
| Limites no frontend | `src/lib/validation.ts` |

## Formato de erro

Toda resposta de erro segue este formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Existem campos inválidos.",
    "details": [
      { "field": "email", "code": "INVALID_FORMAT", "message": "E-mail inválido" }
    ]
  }
}
```

`details` só aparece em erros de validação. `field` pode ser aninhado, como `items.0.quantity`.

| Status | Código | Quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Campo inválido |
| 400 | `INVALID_JSON` | Corpo não é JSON válido |
| 400 | `INVALID_PRODUCT` | Produto não pertence à conta |
| 400 | `CANNOT_REMOVE_OWN_ADMIN` | Admin tenta retirar o próprio acesso |
| 401 | `UNAUTHORIZED` | Token ausente, inválido, expirado, revogado por logout ou troca de senha, ou de conta excluída |
| 401 | `INVALID_CREDENTIALS` | Login errado, mesma resposta para conta existente ou não |
| 403 | `FORBIDDEN` | Sem permissão |
| 404 | `NOT_FOUND` | Registro inexistente ou de outra conta |
| 409 | `EMAIL_TAKEN` | E-mail já cadastrado |
| 409 | `HAS_DEPENDENCIES` | Registro com vínculos |
| 409 | `LAST_ADMIN` | Exclusão do último admin |
| 409 | `INVALID_STATE_TRANSITION` | Mudança de status não permitida (400 ao criar) |
| 409 | `CONFLICT` | Pedido alterado por outra operação |
| 413 | `PAYLOAD_TOO_LARGE` | Corpo acima de 200 KB |
| 429 | `RATE_LIMITED` | Limite atingido |
| 500 | `INTERNAL_ERROR` | Erro inesperado, sem detalhes |
| 502 | `AI_INVALID_RESPONSE` | IA respondeu algo inválido |
| 503 | `AI_UNAVAILABLE` | IA sobrecarregada |

Códigos em `details`: `REQUIRED`, `INVALID_TYPE`, `INVALID_FORMAT`, `INVALID_VALUE`, `MIN_LENGTH`, `MAX_LENGTH`, `MIN_VALUE`, `MAX_VALUE`, `MIN_ITEMS`, `MAX_ITEMS`, `UNKNOWN_FIELD`.

## Convenções

- **Corpos estritos.** Campo não listado responde 400, o que impede mass assignment.
- **Query.** Rota que não declara query recusa qualquer parâmetro.
- **Ids.** Formato UUID, validado antes de chegar ao banco.
- **Outra conta.** Pedido e produto de outra conta respondem 404, para não revelar que o id existe. Em usuários a resposta é 403.
- **Sem sanitização genérica.** Texto é guardado como veio e o React faz o escape ao exibir.

## Textos

Use o helper `text()`. Ele normaliza para NFC, remove espaços externos, recusa campo só com espaços, aplica limites e recusa caracteres de controle e surrogates isolados.

Nomes e textos livres **não** têm restrição de alfabeto: acentos, apóstrofos, hífens, emojis e outros alfabetos são válidos. Quebras de linha e tabulação só valem em campos multilinha.

## Limites

| Campo | Mín. | Máx. | Obrigatório | Observação |
|---|---:|---:|---|---|
| Usuário: nome | 3 | 120 | Sim | Uma linha |
| Usuário: e-mail | — | 254 | Sim | Trim, minúsculas, único sem diferenciar maiúsculas |
| Usuário: senha | 8 | 72 bytes | No cadastro | Ver política abaixo |
| Login: senha | 1 | 256 | Sim | Sem política, para não trancar contas antigas |
| Produto: nome | 1 | 160 | Sim | Uma linha |
| Produto: categoria | 0 | 80 | Não | Aceita nulo |
| Produto: descrição | 0 | 2.000 | Não | Multilinha, aceita nulo |
| Produto: preço | 0,01 | 1.000.000,00 | Sim | Até 2 casas |
| Pedido: cliente | 1 | 120 | Sim | |
| Pedido: telefone | — | 25 | Sim | Ver regra abaixo |
| Pedido: endereço | 1 | 500 | Sim | |
| Pedido: mensagem | 0 | 50.000 | Não | |
| Item: nome | 1 | 200 | Sim | |
| Item: quantidade | 1 | 10.000 | Sim | Inteiro |
| Item: preço unitário | 0 | 1.000.000,00 | Sim | Até 2 casas |
| Pedido: itens | 1 | 100 | Sim | |
| Pedido: valor total | — | 1.000.000.000,00 | — | Calculado no servidor |
| `/parse`: mensagem | 1 | 50.000 | Sim | |
| Paginação: `limit` | 1 | 500 | Não | Padrão 500 |
| Paginação: `page` | 1 | 1.000.000 | Não | Padrão 1 |
| Corpo da requisição | — | 200 KB | — | |

## Telefone

Aceita máscara e grava normalizado. Número brasileiro fica só com dígitos, sem o 55: 11 dígitos com o terceiro igual a 9, ou 10 dígitos com o terceiro de 2 a 5, e DDD sem zero. Número internacional começa com `+` e tem de 8 a 15 dígitos, no formato E.164. O valor `00000000000` marca telefone não informado em pedidos da IA, para que o pedido continue editável.

## Status do pedido

| De | Para |
|---|---|
| `PENDENTE` | `CONCLUIDO`, `CANCELADO` |
| `CONCLUIDO` | `CANCELADO` |
| `CANCELADO` | Nenhum (final) |

Manter o mesmo status é sempre permitido, então repetir a requisição é seguro. Pedido novo começa em `PENDENTE` ou `CONCLUIDO`. A regra fica em um único mapa, em `src/modules/orders/domain/orderStatus.ts`. Status antigo fora da lista pode ser corrigido. Cada criação e mudança gera uma linha em `OrderStatusHistory`.

## Dinheiro

No banco é `numeric(12,2)`, e a API continua devolvendo número. Totais são sempre calculados no servidor, em centavos.

## Importação da IA

A conversa é limpa de caracteres de controle, em vez de recusada, porque vem de terceiros. A resposta da IA passa por `aiOrderSchema`: dados do cliente recebem valor padrão, e itens inválidos impedem gravar. A mesma conversa importada de novo pela mesma conta em até 10 minutos devolve o pedido existente, sem chamar a IA.

## Senhas

Mínimo de 8 caracteres e máximo de 72 bytes. **Não há regra de composição**, porque exigir símbolos leva a senhas previsíveis sem aumentar a proteção. São recusadas senhas só com espaços, com caractere nulo e as mais óbvias (`12345678`, `password`, `senha123`). Senhas não passam por trim e nunca vão para logs.

O limite de 72 bytes existe porque o bcrypt ignora o que vem depois, e o caractere nulo porque o bcrypt para nele.

## Sessão

O token é um JWT HS256 de 1 dia com identificador único (`jti`) e a versão da senha (`ver`). A cada requisição o backend confere conta, papel, versão e se o token foi revogado.

| Ação | Efeito |
|---|---|
| `POST /api/auth/logout` | Revoga só a sessão atual |
| Troca de senha, pela própria conta ou por admin | Revoga todas as sessões da conta |
| Exclusão da conta | Todas as sessões deixam de valer na hora |

No frontend, qualquer 401 limpa a sessão e leva ao login com aviso.

## Limites de uso

| Rota | Limite | Conta |
|---|---|---|
| Todas | 300 a cada 15 min | Por IP |
| Login | 10 erros a cada 15 min | Por IP |
| Cadastro | 10 contas por hora | Por IP |
| `/parse` | 20 a cada 15 min | Por conta |

## Paginação

`GET /user`, `GET /product` e `GET /order` aceitam `?page=1&limit=100` e informam o total no cabeçalho `X-Total-Count`. A ordenação é fixa no servidor. O padrão de 500 preserva o comportamento do frontend, que ainda carrega a lista inteira e filtra no navegador.

## Observabilidade

Cada requisição recebe um id, devolvido em `X-Request-Id` e reaproveitado se vier do cliente com formato seguro. O backend grava uma linha JSON por requisição com método, rota sem query, status e duração. Corpo, query, token e dados de clientes nunca entram no log. `/health` consulta o banco, responde 503 se ele estiver fora e não consome o limite de requisições.

## Como adicionar um campo

1. Inclua o campo e o limite no schema de entrada do módulo, em `src/modules/<módulo>/presentation/`.
2. Escreva testes dos casos válidos, dos limites e dos inválidos.
3. Inclua na lista fechada de campos do repositório.
4. Replique o limite em `src/lib/validation.ts` no frontend e, se for o caso, na extensão.
5. Atualize a tabela de limites acima.

## Testes

Cada regra precisa de caso positivo, negativo e de limite. Os testes de API usam o Express real e PostgreSQL real em `chat2order_test`, e a suíte recusa rodar em outro banco. Testes negativos cobrem também tentativas de contornar o frontend, com requisições diretas. Os E2E ficam no frontend, em `e2e/`, e rodam com `npm run test:e2e` contra os servidores locais.
