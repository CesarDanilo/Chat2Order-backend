import { calculateOrderTotals } from "../../modules/orders/domain/orderTotals";

describe("calculateOrderTotals", () => {
  it("calcula o total de cada item e do pedido", () => {
    const result = calculateOrderTotals([
      { quantity: 2, unitPrice: 45 },
      { quantity: 1, unitPrice: 30 },
    ]);

    expect(result.items.map((item) => item.totalPrice)).toEqual([90, 30]);
    expect(result.total).toBe(120);
  });

  it("não acumula erro de ponto flutuante", () => {
    const result = calculateOrderTotals([
      { quantity: 3, unitPrice: 19.9 },
      { quantity: 1, unitPrice: 0.1 },
      { quantity: 1, unitPrice: 0.2 },
    ]);

    expect(result.total).toBe(60);
  });

  it("aceita item gratuito", () => {
    expect(calculateOrderTotals([{ quantity: 5, unitPrice: 0 }]).total).toBe(0);
  });
});
