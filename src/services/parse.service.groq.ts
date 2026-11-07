import Groq from "groq-sdk";
import { prisma } from "../shared/database/prisma";
import { AppError } from "../shared/errors/AppError";
import { aiOrderSchema } from "../schemas/parse.schema";
import { calculateOrderTotals } from "../modules/orders/domain/orderTotals";

// Mesma conversa importada de novo neste intervalo devolve o pedido já criado.
const REPEATED_IMPORT_WINDOW = 10 * 60 * 1000;

const UNREADABLE_ANSWER = "Não foi possível interpretar a conversa. Tente novamente.";

const PROMPT =
  'Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endereço","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endereço, use \'N/A\'; Retorne apenas o código, sem textos explicativos. Responda apenas com o JSON purificado. Não use blocos código markdown. Conversa: ';

async function askAi(message: string) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: PROMPT + message }],
      model: "llama-3.1-8b-instant",
    });

    return completion.choices[0]?.message?.content ?? "";
  } catch (error: any) {
    console.error("Falha ao chamar a IA:", error.status ?? "sem status");

    if (error.status === 503) {
      throw new AppError(
        503,
        "AI_UNAVAILABLE",
        "A IA está temporariamente sobrecarregada. Tente novamente em alguns segundos.",
      );
    }

    throw new AppError(502, "AI_INVALID_RESPONSE", UNREADABLE_ANSWER);
  }
}

function readAnswer(answer: string) {
  let content: unknown;

  try {
    content = JSON.parse(answer);
  } catch {
    throw new AppError(502, "AI_INVALID_RESPONSE", UNREADABLE_ANSWER);
  }

  const result = aiOrderSchema.safeParse(content);
  if (!result.success) throw new AppError(502, "AI_INVALID_RESPONSE", UNREADABLE_ANSWER);

  return result.data;
}

const findRecentImport = (message: string, userId: string) =>
  prisma.order.findFirst({
    where: {
      userId,
      source: "WHATSAPP",
      rawMessage: message,
      createdAt: { gte: new Date(Date.now() - REPEATED_IMPORT_WINDOW) },
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

export class ParserService {
  async execute(message: string, userId: string) {
    const existing = await findRecentImport(message, userId);

    if (existing) return existing;

    const parsed = readAnswer(await askAi(message));
    const { items, total } = calculateOrderTotals(parsed.items);

    return await prisma.order.create({
      data: {
        userId,
        customerName: parsed.customerName,
        customerPhone: parsed.customerPhone,
        address: parsed.address,
        paymentMethod: parsed.paymentMethod,
        status: "PENDENTE",
        total,
        source: "WHATSAPP",
        rawMessage: message,

        items: {
          create: items,
        },

        history: {
          create: { status: "PENDENTE" },
        },
      },
      include: {
        items: true,
      },
    });
  }
}
