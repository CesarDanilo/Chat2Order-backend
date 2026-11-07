import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import { requestLogEntry } from "../../shared/http/requestLogger";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("health check", () => {
  it("informa a aplicação e o banco", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual({
      status: "ok",
      database: "ok",
      uptime: expect.any(Number),
    });
  });

  it("não consome o limite de requisições", async () => {
    const response = await request(app).get("/health").expect(200);
    expect(response.headers["ratelimit-remaining"]).toBeUndefined();
  });
});

describe("id da requisição", () => {
  it("é gerado e devolvido no cabeçalho", async () => {
    const response = await request(app).get("/health");
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("reaproveita um id válido enviado pelo cliente", async () => {
    const response = await request(app).get("/health").set("X-Request-Id", "pedido-abc_123");
    expect(response.headers["x-request-id"]).toBe("pedido-abc_123");
  });

  it.each([
    ["com caracteres não permitidos", "<script>"],
    ["com quebra de linha", "abc\ndef"],
    ["longo demais", "a".repeat(65)],
  ])("troca um id %s", async (_label, id) => {
    const response = await request(app).get("/health").set("X-Request-Id", id);
    expect(response.headers["x-request-id"]).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe("registro de requisições", () => {
  const entry = requestLogEntry({
    requestId: "id-1",
    method: "POST",
    url: "/api/auth/login?email=ana@x.local&token=abc",
    status: 401,
    durationMs: 12.345,
    userId: undefined,
  });

  it("registra método, rota sem query, status e duração", () => {
    expect(entry).toEqual({
      level: "info",
      message: "request",
      requestId: "id-1",
      method: "POST",
      path: "/api/auth/login",
      status: 401,
      durationMs: 12,
    });
  });

  it("nunca inclui query, corpo, token ou e-mail", () => {
    expect(JSON.stringify(entry)).not.toMatch(/ana@x\.local|token|abc|password/);
  });

  it("marca erros do servidor como error", () => {
    const failed = requestLogEntry({ requestId: "x", method: "GET", url: "/", status: 500, durationMs: 1 });
    expect(failed.level).toBe("error");
  });
});
