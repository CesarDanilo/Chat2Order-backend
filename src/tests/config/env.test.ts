import { loadEnv } from "../../app/config/env";

const valid = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/app",
  JWT_SECRET: "a".repeat(32),
};

describe("loadEnv", () => {
  it("aceita a configuração mínima e aplica padrões", () => {
    const env = loadEnv(valid);

    expect(env.PORT).toBe(3000);
    expect(env.NODE_ENV).toBe("development");
  });

  it("aceita porta configurada", () => {
    expect(loadEnv({ ...valid, PORT: "3001" }).PORT).toBe(3001);
  });

  it("trata chave de IA vazia como ausente", () => {
    expect(loadEnv({ ...valid, GROQ_API_KEY: "" }).GROQ_API_KEY).toBeUndefined();
  });

  it("aceita a origem de uma ou mais extensões", () => {
    const origin = `chrome-extension://${"a".repeat(32)}`;

    expect(loadEnv({ ...valid, EXTENSION_ORIGINS: `${origin},${origin}` }).EXTENSION_ORIGINS).toBeDefined();
  });

  it.each([
    ["curinga de extensão", { ...valid, EXTENSION_ORIGINS: "chrome-extension://*" }, "EXTENSION_ORIGINS"],
    ["origem que não é de extensão", { ...valid, EXTENSION_ORIGINS: "https://site.test" }, "EXTENSION_ORIGINS"],
    ["sem DATABASE_URL", { JWT_SECRET: valid.JWT_SECRET }, "DATABASE_URL"],
    ["DATABASE_URL que não é postgres", { ...valid, DATABASE_URL: "mysql://x" }, "DATABASE_URL"],
    ["sem JWT_SECRET", { DATABASE_URL: valid.DATABASE_URL }, "JWT_SECRET"],
    ["JWT_SECRET curto", { ...valid, JWT_SECRET: "curto" }, "JWT_SECRET"],
    ["porta inválida", { ...valid, PORT: "99999" }, "PORT"],
    ["NODE_ENV desconhecido", { ...valid, NODE_ENV: "qa" }, "NODE_ENV"],
  ])("recusa %s, citando só o nome da variável", (_label, source, field) => {
    expect(() => loadEnv(source)).toThrow(field);
  });

  it("não expõe o valor do segredo no erro", () => {
    expect(() => loadEnv({ ...valid, JWT_SECRET: "segredo-curto" })).not.toThrow(/segredo-curto/);
  });
});
