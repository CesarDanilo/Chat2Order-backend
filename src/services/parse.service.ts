import { prisma } from "../config/prisma";

export class ParserService{
  async execute(message: string){
    const parsedData = {
      customerName: "João",
      customerPhone: "67999999999",
      address: "Rua A, 123",
      paymentMethod: "pix",
      items: [
        {
          productName: "Pizza",
          quantity: 2,
          unitPrice: 30,
          totalPrice: 60,
        },
      ],
      total: 60,
    };

    const order = await prisma.order.create({
      data: {
        userId: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91",
        customerName: parsedData.customerName,
        customerPhone: parsedData.customerPhone,
        address: parsedData.address,
        paymentMethod: parsedData.paymentMethod,
        status: "pending",
        total: parsedData.total,
        source: "whatsapp",
        rawMessage: message,

        items: {
          create: parsedData.items,
        },
      },
      include: {
        items: true,
      },
    });

    return order;
  }
}