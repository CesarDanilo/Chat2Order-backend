import { Request, Response } from "express";
import { ParserService } from "../services/parse.service";

const parserService = new ParserService();

export class ParseController {
  async handle(req: Request, res: Response) {
    try {
      const  message = req.body.message;

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