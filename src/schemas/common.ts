import { z } from "zod";

z.config(z.locales.pt());

export const LIMITS = {
  name: { min: 3, max: 120 },
  email: 254,
  password: { min: 8, maxBytes: 72, maxLogin: 256 },
  customerName: 120,
  phone: 25,
  address: 500,
  productName: 160,
  itemName: 200,
  description: 2000,
  category: 80,
  maxPrice: 1_000_000,
  maxQuantity: 10_000,
  maxItems: 100,
  maxOrderTotal: 1_000_000_000,
  rawMessage: 50_000,
  maxPageSize: 500,
  maxPage: 1_000_000,
} as const;

export const PHONE_PATTERN = /^[0-9()+\-\s]+$/;

export const idParams = z.strictObject({
  id: z.uuid("Identificador inválido"),
});

export const noQuery = z.strictObject({});

const positiveInteger = (max: number) =>
  z
    .string("Número inválido")
    .regex(/^[1-9][0-9]{0,6}$/, "Número inválido")
    .transform(Number)
    .refine((value) => value <= max, "Número acima do limite");

export const paginationQuery = z.strictObject({
  page: positiveInteger(LIMITS.maxPage).default(1),
  limit: positiveInteger(LIMITS.maxPageSize).default(LIMITS.maxPageSize),
});

export type Pagination = z.infer<typeof paginationQuery>;

export const toSkipTake = ({ page, limit }: Pagination) => ({
  skip: (page - 1) * limit,
  take: limit,
});

// Quebras de linha e tabulação só são válidas em campos de várias linhas.
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;
const CONTROL_CHARS_EXCEPT_LINE_BREAKS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const LONE_SURROGATE = /\p{Cs}/u;

const hasForbiddenChars = (value: string, multiline: boolean) =>
  LONE_SURROGATE.test(value) ||
  (multiline ? CONTROL_CHARS_EXCEPT_LINE_BREAKS : CONTROL_CHARS).test(value);

// Texto de terceiros, como a conversa do WhatsApp: limpa em vez de recusar.
export const stripForbiddenChars = (value: string, multiline = false) =>
  value
    .replace(new RegExp((multiline ? CONTROL_CHARS_EXCEPT_LINE_BREAKS : CONTROL_CHARS).source, "g"), "")
    .replace(/\p{Cs}/gu, "")
    .normalize("NFC");

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type TextOptions = {
  label: string;
  max: number;
  min?: number;
  multiline?: boolean;
};

// Texto livre: não restringe alfabeto, porque nomes reais têm acentos, apóstrofos e emojis.
export function text({ label, max, min = 1, multiline = false }: TextOptions) {
  const title = capitalize(label);

  return z
    .string(`Informe ${label}`)
    .normalize("NFC")
    .trim()
    .min(min, min === 1 ? `Informe ${label}` : `${title} deve ter no mínimo ${min} caracteres`)
    .max(max, `${title} deve ter no máximo ${max} caracteres`)
    .refine((value) => !hasForbiddenChars(value, multiline), `${title} contém caracteres inválidos`);
}

const hasAtMostTwoDecimals = (value: number) =>
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

export const money = (label: string) =>
  z
    .number(`${label} deve ser um número`)
    .max(LIMITS.maxPrice, `${label} acima do limite`)
    .refine(hasAtMostTwoDecimals, `${label} deve ter no máximo 2 casas decimais`);
