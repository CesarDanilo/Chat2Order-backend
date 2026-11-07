import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { TEST_EXTENSION_ORIGIN } from "./support/env";

afterAll(async () => {
  await prisma.$disconnect();
});

const preflight = (origin: string) =>
  request(app)
    .options("/api/auth/login")
    .set("Origin", origin)
    .set("Access-Control-Request-Method", "POST")
    .set("Access-Control-Request-Headers", "content-type");

describe("CORS", () => {
  it("libera o frontend local", async () => {
    const response = await preflight("http://localhost:5173");
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
  });

  it("libera a extensão configurada", async () => {
    const response = await preflight(TEST_EXTENSION_ORIGIN);
    expect(response.headers["access-control-allow-origin"]).toBe(TEST_EXTENSION_ORIGIN);
  });

  it.each([
    ["outra extensão", "chrome-extension://zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"],
    ["site qualquer", "https://exemplo-invasor.test"],
  ])("não libera %s", async (_label, origin) => {
    const response = await preflight(origin);
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
