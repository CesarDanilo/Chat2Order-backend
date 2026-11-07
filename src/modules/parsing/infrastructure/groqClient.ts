import Groq from "groq-sdk";
import { AppError } from "../../../shared/errors/AppError";

export const UNREADABLE_ANSWER = "Não foi possível interpretar a conversa. Tente novamente.";

const PROMPT =
  'Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endereço","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endereço, use \'N/A\'; Retorne apenas o código, sem textos explicativos. Responda apenas com o JSON purificado. Não use blocos código markdown. Conversa: ';

// Devolve o texto bruto da IA. Erros do provedor nunca chegam ao cliente com detalhes.
export async function askAi(message: string) {
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
