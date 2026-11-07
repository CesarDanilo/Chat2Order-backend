type PricedItem = {
  quantity: number;
  unitPrice: number;
};

const toCents = (value: number) => Math.round(value * 100);

// Soma em centavos para evitar erro de arredondamento de ponto flutuante.
export function calculateOrderTotals<T extends PricedItem>(items: T[]) {
  const pricedItems = items.map((item) => ({
    ...item,
    totalPrice: (toCents(item.unitPrice) * item.quantity) / 100,
  }));

  const totalInCents = pricedItems.reduce(
    (sum, item) => sum + toCents(item.totalPrice),
    0,
  );

  return { items: pricedItems, total: totalInCents / 100 };
}
