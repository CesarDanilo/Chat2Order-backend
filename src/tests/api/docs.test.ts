import request from "supertest";

describe("documentação da API", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  const loadApp = () => require("../../app").default;

  it("fica disponível fora de produção", async () => {
    process.env.NODE_ENV = "test";

    await request(loadApp()).get("/docs/").expect(200);
  });

  it("não é exposta em produção", async () => {
    process.env.NODE_ENV = "production";

    await request(loadApp()).get("/docs/").expect(404);
  });
});
