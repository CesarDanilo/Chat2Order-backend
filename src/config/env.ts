import { z } from "zod";

const emptyAsUndefined = (value: unknown) => (value === "" ? undefined : value);

const EXTENSION_ORIGINS = /^chrome-extension:\/\/[a-p]{32}(,chrome-extension:\/\/[a-p]{32})*$/;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().regex(/^postgres(ql)?:\/\//),
  JWT_SECRET: z.string().min(32),
  GROQ_API_KEY: z.preprocess(emptyAsUndefined, z.string().optional()),
  EXTENSION_ORIGINS: z.preprocess(emptyAsUndefined, z.string().regex(EXTENSION_ORIGINS).optional()),
});

export type Env = z.infer<typeof envSchema>;

// Falha logo ao iniciar. O erro cita só o nome da variável, nunca o valor.
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Configuração inválida: ${names.join(", ")}`);
  }

  return result.data;
}
