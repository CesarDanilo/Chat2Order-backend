import { PHONE_PATTERN } from "./common";

// Marcador para pedido da IA sem telefone: permite editar o pedido sem inventar um número.
export const UNKNOWN_PHONE = "00000000000";

// DDD sem zero, celular com 9 na frente e fixo começando de 2 a 5.
const BRAZILIAN_PHONE = /^[1-9][1-9](?:9[0-9]{8}|[2-5][0-9]{7})$/;
const INTERNATIONAL_DIGITS = /^[1-9][0-9]{7,14}$/;

// Grava só dígitos: nacional sem o 55, internacional no formato E.164. Inválido devolve null.
export function normalizePhone(value: string) {
  const text = value.trim();

  if (!PHONE_PATTERN.test(text)) return null;

  const digits = text.replace(/[^0-9]/g, "");

  if (digits === UNKNOWN_PHONE) return UNKNOWN_PHONE;

  if (text.startsWith("+") && !digits.startsWith("55")) {
    return INTERNATIONAL_DIGITS.test(digits) ? `+${digits}` : null;
  }

  const national = digits.length >= 12 && digits.startsWith("55") ? digits.slice(2) : digits;

  return BRAZILIAN_PHONE.test(national) ? national : null;
}
