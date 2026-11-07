type Level = "info" | "warn" | "error";

type Fields = Record<string, string | number | boolean | undefined>;

// Uma linha JSON por evento, fácil de filtrar nos logs da Railway. Em testes fica em silêncio.
// Nunca passe aqui senha, token, corpo de requisição ou dados de clientes.
export function log(level: Level, message: string, fields: Fields = {}) {
  if (process.env.NODE_ENV === "test") return;

  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });

  if (level === "error") console.error(line);
  else console.log(line);
}
