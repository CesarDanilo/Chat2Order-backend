import { createOrderService } from "../../orders";
import { AppError } from "../../../shared/errors/AppError";
import { UNREADABLE_ANSWER, askAi } from "../infrastructure/groqClient";
import { aiOrderSchema } from "./parse.schema";

// Mesma conversa importada de novo neste intervalo devolve o pedido já criado.
const REPEATED_IMPORT_WINDOW = 10 * 60 * 1000;

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

export class ParserService {
  async execute(message: string, userId: string) {
    const orders = createOrderService();
    const since = new Date(Date.now() - REPEATED_IMPORT_WINDOW);

    const existing = await orders.FindRecentImport(userId, message, since);
    if (existing) return existing;

    const parsed = readAnswer(await askAi(message));

    return await orders.CreateImportedOrder(userId, { ...parsed, rawMessage: message });
  }
}
