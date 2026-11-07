import { config } from "dotenv";

/**
 * Lê o banco de testes de `.env.test`. O nome precisa terminar em `_test`,
 * porque a suíte apaga os dados antes de rodar e nunca pode alcançar outro banco.
 */
export function getTestDatabaseUrl(): string {
  config({ path: ".env.test", quiet: true });

  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      "Defina TEST_DATABASE_URL (copie .env.test.example para .env.test).",
    );
  }

  if (!new URL(url).pathname.endsWith("_test")) {
    throw new Error("TEST_DATABASE_URL precisa apontar para um banco *_test.");
  }

  return url;
}
