import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

type KnownError = { status: number; code: string; message: string };

const BODY_PARSER_ERRORS: Record<string, KnownError> = {
  "entity.parse.failed": { status: 400, code: "INVALID_JSON", message: "JSON inválido." },
  "entity.too.large": {
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: "O conteúdo enviado é grande demais.",
  },
};

const PRISMA_ERRORS: Record<string, KnownError> = {
  P2002: { status: 409, code: "EMAIL_TAKEN", message: "Já existe um cadastro com este e-mail." },
  P2003: {
    status: 409,
    code: "HAS_DEPENDENCIES",
    message: "Não é possível concluir: existem registros vinculados.",
  },
  P2025: { status: 404, code: "NOT_FOUND", message: "Registro não encontrado." },
};

const respond = (res: Response, { status, code, message }: KnownError) =>
  res.status(status).json({ error: { code, message } });

// Último middleware: nenhuma resposta de erro leva stack ou detalhe interno.
export function errorHandler(error: any, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) return respond(res, error);

  const known = BODY_PARSER_ERRORS[error.type] ?? PRISMA_ERRORS[error.code];
  if (known) return respond(res, known);

  console.error("Erro não tratado:", error.name, error.code ?? "", error.message);

  return respond(res, {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Erro interno do servidor.",
  });
}
