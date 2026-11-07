import { canCreateWith, canTransition } from "../../modules/orders/domain/orderStatus";

describe("canTransition", () => {
  it.each([
    ["PENDENTE", "CONCLUIDO", true],
    ["PENDENTE", "CANCELADO", true],
    ["CONCLUIDO", "CANCELADO", true],
    ["CONCLUIDO", "PENDENTE", false],
    ["CANCELADO", "PENDENTE", false],
    ["CANCELADO", "CONCLUIDO", false],
  ])("%s para %s: %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });

  it.each(["PENDENTE", "CONCLUIDO", "CANCELADO"])("manter %s é sempre permitido", (status) => {
    expect(canTransition(status, status)).toBe(true);
  });

  it("status antigo fora da lista pode ser corrigido", () => {
    expect(canTransition("pending", "CONCLUIDO")).toBe(true);
  });
});

describe("canCreateWith", () => {
  it.each([
    ["PENDENTE", true],
    ["CONCLUIDO", true],
    ["CANCELADO", false],
  ])("%s: %s", (status, expected) => {
    expect(canCreateWith(status)).toBe(expected);
  });
});
