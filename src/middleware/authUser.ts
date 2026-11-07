import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { PrismaUsersRepository } from "../repository/PrismaUsersRepository";

const BEARER_TOKEN = /^Bearer ([A-Za-z0-9\-_.]{1,2048})$/;

const unauthorized = () =>
  new AppError(401, "UNAUTHORIZED", "Sessão inválida ou expirada. Entre novamente.");

const forbidden = () =>
  new AppError(403, "FORBIDDEN", "Você não tem permissão para esta ação.");

function readSubject(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });

    return typeof payload === "object" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
}

// A cada requisição confere se a conta existe e lê o papel do banco: excluir uma conta ou
// retirar o admin vale na hora, sem esperar o token expirar.
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = BEARER_TOKEN.exec(req.headers.authorization ?? "")?.[1];
  const subject = token && readSubject(token);

  if (!subject) throw unauthorized();

  const user = await new PrismaUsersRepository().findById(subject);

  if (!user) throw unauthorized();

  (req as any).user = { id: user.id, admin: user.admin };

  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!(req as any).user.admin) throw forbidden();

  next();
}

export function requireSelfOrAdmin(req: Request, _res: Response, next: NextFunction) {
  const { id, admin } = (req as any).user;

  if (req.params.id !== id && !admin) throw forbidden();

  next();
}

// Só admin altera o papel, e nunca para retirar o próprio acesso.
export function guardRoleChange(req: Request, _res: Response, next: NextFunction) {
  if (req.body.admin === undefined) return next();

  const { id, admin } = (req as any).user;

  if (!admin) throw forbidden();

  if (req.params.id === id && req.body.admin === false) {
    throw new AppError(
      400,
      "CANNOT_REMOVE_OWN_ADMIN",
      "Você não pode remover o próprio acesso de administrador.",
    );
  }

  next();
}
