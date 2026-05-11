import { prisma } from "../config/prisma";
import { GoogleGenAI } from "@google/genai";

export class ParserService{



  async execute(message: string, userId: string){

    interface IItem {
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }

    interface IParsedDataType {
      customerName: string;
      customerPhone: string;
      address: string;
      paymentMethod: string;
      items: IItem[];
      total: number;
    }

    const ai = new GoogleGenAI({});
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {\"customerName\":\"Nome\",\"customerPhone\":\"Telefone\",\"address\":\"Endereço\",\"paymentMethod\":\"Forma de pagamento\",\"items\":[{\"productName\":\"Produto\",\"quantity\":0,\"unitPrice\":0.00,\"totalPrice\":0.00}],\"total\":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endereço, use 'N/A'; Retorne apenas o código, sem textos explicativos. Conversa: " + message,
    })

    console.log(response.text);

    const parsedData: IParsedDataType = JSON.parse(response.text || "{}");


    const order = await prisma.order.create({
      data: {
        userId: userId,
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