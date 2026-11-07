// Valores aceitos em pedidos. A mesma lista é garantida por constraints CHECK no banco.
export const ORDER_STATUSES = ["PENDENTE", "CONCLUIDO", "CANCELADO"] as const;
export const PAYMENT_METHODS = ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"] as const;
export const ORDER_SOURCES = ["WHATSAPP", "SITE"] as const;
