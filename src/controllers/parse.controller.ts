import { Request, Response } from "express";
import { ParserService } from "../services/parse.service";

const parserService = new ParserService();

export class ParseController {
  async handle(req: Request, res: Response) {
    try {
      const  message = "Atendente: Olá! Boa noite. Qual seu pedido? João: Oi, boa noite! Quero duas pizzas, por favor. Atendente: Com certeza. Qual o endereço para entrega? João: Rua A, 123.Atendente: Perfeito. Fica em 30 reais cada uma. Como prefere pagar? João: Vou fazer um pix. O total dá 60, né? Meu número é 67999999999. Atendente: Isso mesmo! Já estamos preparando.";

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const userId = (req as any).user.id;

      const parsedMessage = await parserService.execute(message, userId);
      
      return res.json(parsedMessage);

    } catch (error: any) {
      console.error("❌ Erro detalhado no ParseController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message
      });
    }
  }
}