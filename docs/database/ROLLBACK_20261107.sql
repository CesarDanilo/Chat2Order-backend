-- Reverte a migration 20261107010000_money_decimal_constraints_indexes.
-- Rode só se precisar voltar. Depois, marque a migration como revertida:
--   npx prisma migrate resolve --rolled-back 20261107010000_money_decimal_constraints_indexes
-- A volta preserva os valores em centavos, mas casas além da segunda já foram arredondadas.

DROP INDEX IF EXISTS "Order_userId_createdAt_idx";
DROP INDEX IF EXISTS "OrderItem_orderId_idx";
DROP INDEX IF EXISTS "OrderItem_productId_idx";
DROP INDEX IF EXISTS "OrderStatusHistory_orderId_idx";
DROP INDEX IF EXISTS "AILog_orderId_idx";
DROP INDEX IF EXISTS "Product_userId_idx";

ALTER TABLE "User"
  DROP CONSTRAINT IF EXISTS "User_name_length_check",
  DROP CONSTRAINT IF EXISTS "User_email_length_check";

ALTER TABLE "Order"
  DROP CONSTRAINT IF EXISTS "Order_status_check",
  DROP CONSTRAINT IF EXISTS "Order_paymentMethod_check",
  DROP CONSTRAINT IF EXISTS "Order_source_check",
  DROP CONSTRAINT IF EXISTS "Order_total_check",
  DROP CONSTRAINT IF EXISTS "Order_customerName_check",
  DROP CONSTRAINT IF EXISTS "Order_address_length_check",
  DROP CONSTRAINT IF EXISTS "Order_rawMessage_length_check";

ALTER TABLE "OrderItem"
  DROP CONSTRAINT IF EXISTS "OrderItem_quantity_check",
  DROP CONSTRAINT IF EXISTS "OrderItem_unitPrice_check",
  DROP CONSTRAINT IF EXISTS "OrderItem_totalPrice_check",
  DROP CONSTRAINT IF EXISTS "OrderItem_productName_check";

ALTER TABLE "OrderStatusHistory"
  DROP CONSTRAINT IF EXISTS "OrderStatusHistory_status_check";

ALTER TABLE "Product"
  DROP CONSTRAINT IF EXISTS "Product_price_check",
  DROP CONSTRAINT IF EXISTS "Product_name_check",
  DROP CONSTRAINT IF EXISTS "Product_description_length_check",
  DROP CONSTRAINT IF EXISTS "Product_category_length_check";

ALTER TABLE "Order"
  ALTER COLUMN "total" TYPE DOUBLE PRECISION USING "total"::double precision;

ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE DOUBLE PRECISION USING "unitPrice"::double precision,
  ALTER COLUMN "totalPrice" TYPE DOUBLE PRECISION USING "totalPrice"::double precision;

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DOUBLE PRECISION USING "price"::double precision;
