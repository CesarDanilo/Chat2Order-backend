import { z } from "zod";
import { LIMITS, stripForbiddenChars } from "../shared/validation/common";
import { PAYMENT_METHODS } from "../modules/orders/presentation/order.schema";
import { UNKNOWN_PHONE, normalizePhone } from "../shared/validation/phone";

export const parseMessageSchema = z.strictObject({
  message: z
    .string("Informe a mensagem")
    .transform((value) => stripForbiddenChars(value, true))
    .pipe(
      z
        .string()
        .trim()
        .min(1, "Informe a mensagem")
        .max(LIMITS.rawMessage, "Conversa muito longa"),
    ),
});

type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const PAYMENT_KEYWORDS: [RegExp, PaymentMethod][] = [
  [/d[eé]bito/i, "DEBIT_CARD"],
  [/cr[eé]dito|cart[aã]o/i, "CREDIT_CARD"],
  [/dinheiro|esp[eé]cie/i, "CASH"],
];

function toPaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string") return "PIX";

  const match = PAYMENT_KEYWORDS.find(([pattern]) => pattern.test(value));
  return match ? match[1] : "PIX";
}

const isMissing = (value: string) => value === "" || value.toUpperCase() === "N/A";

const textOrDefault = (max: number, fallback: string) =>
  z.unknown().optional().transform((value) => {
    if (typeof value !== "string") return fallback;

    const text = stripForbiddenChars(value).trim();
    return isMissing(text) ? fallback : text.slice(0, max);
  });

const phone = z.unknown().optional().transform((value) => {
  if (typeof value !== "string") return UNKNOWN_PHONE;

  return normalizePhone(value) ?? UNKNOWN_PHONE;
});

const roundToCents = (value: number) => Math.round(value * 100) / 100;

// Resposta da IA não é confiável. z.object descarta qualquer campo fora desta lista, e
// dados do cliente recebem um valor padrão, mas itens inválidos impedem gravar o pedido.
export const aiOrderSchema = z.object({
  customerName: textOrDefault(LIMITS.customerName, "sem nome"),
  customerPhone: phone,
  address: textOrDefault(LIMITS.address, "sem endereço"),
  paymentMethod: z.unknown().optional().transform(toPaymentMethod),
  items: z
    .array(
      z.object({
        productName: z
          .string()
          .transform((value) => stripForbiddenChars(value))
          .pipe(z.string().trim().min(1).max(LIMITS.itemName)),
        quantity: z.number().int().positive().max(LIMITS.maxQuantity),
        unitPrice: z.number().nonnegative().max(LIMITS.maxPrice).transform(roundToCents),
      }),
    )
    .min(1)
    .max(LIMITS.maxItems),
});
