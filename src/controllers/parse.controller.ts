import { Request, Response } from "express";
import { ParserService } from "../services/parse.service";

const parserService = new ParserService();

export class ParseController {
  async handle(req: Request, res: Response) {
    try {
      const  message = "Olá, meu nome é João e estou";

      // Validação básica: evita erro se a mensagem vier vazia
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const parsedMessage = await parserService.execute(message);
      
      return res.json(parsedMessage);

    } catch (error: any) {
      // ESTA LINHA É A MAIS IMPORTANTE:
      console.error("❌ Erro detalhado no ParseController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message // Opcional: remover em produção por segurança
      });
    }
  }
}