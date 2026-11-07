-- Dinheiro passa de double precision para numeric(12,2). Valores são arredondados para centavos.
ALTER TABLE "Order"
  ALTER COLUMN "total" TYPE DECIMAL(12,2) USING round("total"::numeric, 2);

ALTER TABLE "OrderItem"
  ALTER COLUMN "unitPrice" TYPE DECIMAL(12,2) USING round("unitPrice"::numeric, 2),
  ALTER COLUMN "totalPrice" TYPE DECIMAL(12,2) USING round("totalPrice"::numeric, 2);

ALTER TABLE "Product"
  ALTER COLUMN "price" TYPE DECIMAL(12,2) USING round("price"::numeric, 2);

-- NOT VALID: vale para toda gravação nova, sem falhar em dados antigos já existentes.
-- Depois de corrigir esses dados, cada constraint pode receber VALIDATE CONSTRAINT.
ALTER TABLE "User"
  ADD CONSTRAINT "User_name_length_check" CHECK (char_length("name") <= 120) NOT VALID,
  ADD CONSTRAINT "User_email_length_check" CHECK (char_length("email") <= 254) NOT VALID;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_status_check" CHECK ("status" IN ('PENDENTE', 'CONCLUIDO', 'CANCELADO')) NOT VALID,
  ADD CONSTRAINT "Order_paymentMethod_check" CHECK ("paymentMethod" IN ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH')) NOT VALID,
  ADD CONSTRAINT "Order_source_check" CHECK ("source" IN ('WHATSAPP', 'SITE')) NOT VALID,
  ADD CONSTRAINT "Order_total_check" CHECK ("total" >= 0) NOT VALID,
  ADD CONSTRAINT "Order_customerName_check" CHECK (char_length(btrim("customerName")) BETWEEN 1 AND 120) NOT VALID,
  ADD CONSTRAINT "Order_address_length_check" CHECK (char_length("address") <= 500) NOT VALID,
  ADD CONSTRAINT "Order_rawMessage_length_check" CHECK (char_length("rawMessage") <= 50000) NOT VALID;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" BETWEEN 1 AND 10000) NOT VALID,
  ADD CONSTRAINT "OrderItem_unitPrice_check" CHECK ("unitPrice" >= 0) NOT VALID,
  ADD CONSTRAINT "OrderItem_totalPrice_check" CHECK ("totalPrice" >= 0) NOT VALID,
  ADD CONSTRAINT "OrderItem_productName_check" CHECK (char_length(btrim("productName")) BETWEEN 1 AND 200) NOT VALID;

ALTER TABLE "OrderStatusHistory"
  ADD CONSTRAINT "OrderStatusHistory_status_check" CHECK ("status" IN ('PENDENTE', 'CONCLUIDO', 'CANCELADO')) NOT VALID;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_price_check" CHECK ("price" > 0) NOT VALID,
  ADD CONSTRAINT "Product_name_check" CHECK (char_length(btrim("name")) BETWEEN 1 AND 160) NOT VALID,
  ADD CONSTRAINT "Product_description_length_check" CHECK (char_length("description") <= 2000) NOT VALID,
  ADD CONSTRAINT "Product_category_length_check" CHECK (char_length("category") <= 80) NOT VALID;

-- Índices para as listagens por conta e para as chaves estrangeiras.
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX "AILog_orderId_idx" ON "AILog"("orderId");
CREATE INDEX "Product_userId_idx" ON "Product"("userId");
