import { Request, Response } from "express";
import { ParserService } from "../application/ParseConversationService";

const parserService = new ParserService();

export class ParseController {
  async handle(req: Request, res: Response) {
    const order = await parserService.execute(req.body.message, (req as any).user.id);

    return res.json(order);
  }
}
