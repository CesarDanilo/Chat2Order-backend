# Otimização e integridade do banco

**Migration:** `20261107010000_money_decimal_constraints_indexes`
**Situação:** aplicada nos bancos local e de teste. Produção ainda não.

## O que mudou

| Mudança | Detalhe |
|---|---|
| Dinheiro | `total`, `unitPrice`, `totalPrice` e `price` passam de `double precision` para `numeric(12,2)` |
| 18 constraints CHECK | Status, pagamento, origem, valores não negativos, quantidade, textos não vazios e limites de tamanho |
| 6 índices | `Order(userId, createdAt)`, `OrderItem(orderId)`, `OrderItem(productId)`, `OrderStatusHistory(orderId)`, `AILog(orderId)`, `Product(userId)` |

Na API, dinheiro continua sendo número no JSON.

## Por que NOT VALID

As 18 constraints usam `NOT VALID`: valem para toda gravação nova, mas não falham por dados antigos que já existam. Assim a migration não trava o deploy por causa de um registro legado. Um registro antigo inválido continua legível e só precisa ser corrigido quando for salvo de novo.

## Antes de publicar em produção

**1. Faça backup.** A migration arredonda valores para centavos. Isso não pode ser desfeito.

**2. Procure valores que não cabem no novo tipo.** O máximo é 9.999.999.999,99, e a API antiga não tinha limite. Um valor acima disso faz a migration falhar. Isso aconteceu de verdade no banco de testes, com um pedido de 1 trilhão gravado pelos testes de auditoria.

```sql
SELECT 'Order' AS tabela, count(*) FROM "Order" WHERE abs(total) >= 10000000000
UNION ALL SELECT 'OrderItem', count(*) FROM "OrderItem" WHERE abs("unitPrice") >= 10000000000 OR abs("totalPrice") >= 10000000000
UNION ALL SELECT 'Product', count(*) FROM "Product" WHERE abs(price) >= 10000000000;
```

Todos os resultados precisam ser 0. Se a migration falhar mesmo assim, ela é revertida por inteiro, o deploy para e o Prisma exige `npx prisma migrate resolve --rolled-back` antes de tentar de novo.

**3. Veja quantos dados antigos estão fora das regras.** Não bloqueia o deploy, mas mostra o que limpar depois.

```sql
SELECT count(*) AS pedidos_fora_da_regra FROM "Order"
WHERE status NOT IN ('PENDENTE', 'CONCLUIDO', 'CANCELADO')
   OR "paymentMethod" NOT IN ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH')
   OR source NOT IN ('WHATSAPP', 'SITE')
   OR total < 0;

SELECT count(*) AS produtos_com_preco_invalido FROM "Product" WHERE price <= 0;
SELECT count(*) AS produtos_sem_dono FROM "Product" WHERE "userId" IS NULL;

SELECT lower(email), count(*) FROM "User" GROUP BY 1 HAVING count(*) > 1;
```

A última consulta lista e-mails que só diferem em maiúsculas. Sem esse tipo de duplicata, é seguro criar depois um índice único em `lower(email)`.

## Depois de limpar os dados legados

Para o banco passar a garantir também os registros antigos:

```sql
ALTER TABLE "Order" VALIDATE CONSTRAINT "Order_status_check";
```

Repita para cada constraint. O comando falha, sem alterar nada, se ainda houver dado inválido.

## Rollback

[ROLLBACK_20261107.sql](ROLLBACK_20261107.sql) remove constraints e índices e devolve as colunas para `double precision`. Os valores voltam em centavos, mas o que foi arredondado não retorna; por isso o backup é obrigatório. O código novo também precisa ser revertido, porque ele conta com `Decimal`.

## Validação feita

Em um banco descartável, no estado anterior à migration, com dados legados de propósito inválidos:

| Etapa | Resultado |
|---|---|
| Aplicar a migration | Aprovado, sem falhar pelos dados antigos |
| Valores preservados | `19.9` virou `19.90` e `0.30000000000000004` virou `0.30` |
| Arredondamento | `1234.565` virou `1234.57` e `999.999` virou `1000.00` |
| Gravação inválida nova | Recusada pelo banco |
| Rollback | Tipos e valores restaurados, constraints e índices removidos |
| Reaplicar depois do rollback | Aprovado |

## Não feito

- **DB-01:** `Product.userId` segue divergente entre schema e banco. Definir `NOT NULL` depende de saber se há produtos sem dono em produção.
- **Índice único em `lower(email)`:** depende da consulta de duplicatas acima. Hoje a regra existe só na aplicação.
- **`VALIDATE CONSTRAINT`:** depende da limpeza dos dados de produção.
- **Backups:** a política depende do provedor e não foi verificada.
