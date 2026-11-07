import { z } from "zod";
import { LIMITS } from "../../../shared/validation/common";

// O login não aplica a política de senha: contas antigas podem ter senhas anteriores a ela.
export const loginSchema = z.strictObject({
  email: z
    .string("Informe o e-mail")
    .trim()
    .min(1, "Informe o e-mail")
    .max(LIMITS.email, "E-mail muito longo"),
  password: z
    .string("Informe a senha")
    .min(1, "Informe a senha")
    .max(LIMITS.password.maxLogin, "Senha muito longa"),
});
