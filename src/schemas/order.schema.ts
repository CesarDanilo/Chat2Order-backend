import { z } from "zod";
import { LIMITS, money, text } from "./common";
import { normalizePhone } from "./phone";

export const ORDER_STATUSES = ["PENDENTE", "CONCLUIDO", "CANCELADO"] as const;
export const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"] as const;
export const ORDER_SOURCES = ["WHATSAPP", "SITE"] as const;

const phone = z
  .string("Informe o telefone")
  .max(LIMITS.phone, "Telefone inválido")
  .transform((value, context) => {
    const normalized = normalizePhone(value);

    if (normalized) return normalized;

    context.addIssue({ code: "custom", message: "Telefone inválido" });
    return z.NEVER;
  });

const orderItemSchema = z.strictObject({
  productName: text({ label: "o nome do produto", max: LIMITS.itemName }),
  quantity: z
    .number("A quantidade deve ser um número")
    .int("A quantidade deve ser um número inteiro")
    .positive("A quantidade deve ser maior que 0")
    .max(LIMITS.maxQuantity, "Quantidade acima do limite"),
  unitPrice: money("O preço unitário").refine((value) => value >= 0, "O preço unitário não pode ser negativo"),
  // Aceito por compatibilidade com o frontend, mas sempre recalculado no servidor.
  totalPrice: z.number().optional(),
  productId: z.uuid("Produto inválido").optional(),
});

const orderValue = (items: { quantity: number; unitPrice: number }[]) =>
  items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

export const orderSchema = z.strictObject({
  customerName: text({ label: "o nome do cliente", max: LIMITS.customerName }),
  customerPhone: phone,
  address: text({ label: "o endereço", max: LIMITS.address, multiline: true }),
  paymentMethod: z.enum(PAYMENT_METHODS, "Forma de pagamento inválida"),
  status: z.enum(ORDER_STATUSES, "Status inválido"),
  source: z.enum(ORDER_SOURCES, "Origem inválida"),
  rawMessage: text({
    label: "a mensagem",
    min: 0,
    max: LIMITS.rawMessage,
    multiline: true,
  }).nullish(),
  // Aceito por compatibilidade com o frontend, mas sempre recalculado no servidor.
  total: z.number().nonnegative("O total não pode ser negativo").optional(),
  items: z
    .array(orderItemSchema, "Informe os itens do pedido")
    .min(1, "O pedido deve ter ao menos um item")
    .max(LIMITS.maxItems, `O pedido pode ter no máximo ${LIMITS.maxItems} itens`)
    .refine((items) => orderValue(items) <= LIMITS.maxOrderTotal, "Valor do pedido acima do limite"),
});
