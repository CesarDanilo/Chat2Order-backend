import { prisma } from "../config/prisma";
import Groq from "groq-sdk";

export class ParserService {
  async execute(message: string, userId: string) {
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

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    async function getGroqChatCompletion(message: string) {
      return groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content:
              'Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endereço","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endereço, use \'N/A\'; Retorne apenas o código, sem textos explicativos. Responda apenas com o JSON purificado. Não use blocos código markdown. Conversa: ' +
              message,
          },
        ],
        model: "llama-3.1-8b-instant",
      });
    }

    try {
      const chatCompletion = await getGroqChatCompletion(message);
      const response = chatCompletion.choices[0]?.message?.content || "{}";
      const parsedData: IParsedDataType = JSON.parse(response || "{}");

      const order = await prisma.order.create({
        data: {
          userId: userId,
          customerName: parsedData.customerName || "sem nome",
          customerPhone: parsedData.customerPhone || "(00) 0 0000-0000",
          address: parsedData.address || "sem endereço",
          paymentMethod: parsedData.paymentMethod || "PIX",
          status: "PENDENTE",
          total: parsedData.total,
          source: "WHATSAPP",
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
    } catch (error: any) {
      console.error("Erro completo:", error);

      if (error.status === 503) {
        throw new Error(
          "A IA está temporariamente sobrecarregada. Tente novamente em alguns segundos.",
        );
      }

      if (error instanceof SyntaxError) {
        console.error("Erro ao fazer parse do JSON:", error.message);
        throw new Error("Resposta da IA em formato inválido. Tente novamente.");
      }

      if (error.code === "P2002" || error.code === "P2003") {
        throw new Error("Erro ao salvar pedido no banco de dados.");
      }

      console.error("Stack trace:", error.stack);
      throw new Error(`Erro ao processar mensagem com IA: ${error.message}`);
    }
  }
}
