import { z } from "zod";
import { LIMITS, text } from "../../../shared/validation/common";

const name = text({
  label: "o nome",
  min: LIMITS.name.min,
  max: LIMITS.name.max,
});

// E-mails são comparados e gravados em minúsculas.
const email = z
  .string("Informe o e-mail")
  .trim()
  .toLowerCase()
  .max(LIMITS.email, "E-mail muito longo")
  .pipe(z.email("E-mail inválido"));

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "password",
  "password1",
  "senha123",
  "qwerty123",
  "abcd1234",
  "11111111",
  "00000000",
]);

// Sem regras de composição: comprimento e uma lista de senhas óbvias protegem mais do que
// exigir símbolos. bcrypt só usa 72 bytes e para no caractere nulo, por isso os dois limites.
const password = z
  .string("Informe a senha")
  .min(LIMITS.password.min, `A senha deve ter no mínimo ${LIMITS.password.min} caracteres`)
  .refine(
    (value) => Buffer.byteLength(value) <= LIMITS.password.maxBytes,
    "A senha é longa demais",
  )
  .refine((value) => value.trim() !== "", "A senha não pode ser só espaços")
  .refine((value) => !value.includes("\u0000"), "A senha contém caracteres inválidos")
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), "Escolha uma senha menos comum");

export const createUserSchema = z.strictObject({ name, email, password });

export const updateUserSchema = z.strictObject({
  name,
  email,
  password: password.optional(),
  admin: z.boolean("Valor inválido para administrador").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
