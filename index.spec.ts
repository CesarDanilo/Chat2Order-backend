import { ParserService } from "./src/services/parse.service";
import { prisma } from "./src/config/prisma";

jest.mock("./src/config/prisma", () => ({
  prisma: {
    order: {
      create: jest.fn(),
    },
  },
}));

describe("ParserService", () => {
  it("should create an order correctly", async () => {
    const mockOrder = {
      id: "1",
      customerName: "João", 
      total: 60,
      items: [
        {
          productName: "Pizza",
          quantity: 2,
        },
      ],
    };

    (prisma.order.create as jest.Mock).mockResolvedValue(mockOrder);

    const parser = new ParserService();
    const result = await parser.execute("message test");

    expect(prisma.order.create).toHaveBeenCalled();

    expect(result).toEqual(mockOrder);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          customerName: "João",
          total: 60,
        }),
      })
    );
  });
});