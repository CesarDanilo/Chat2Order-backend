import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { PrismaUsersRepository } from "../infrastructure/PrismaUsersRepository";
import { isRevoked, readToken } from "../application/sessionService";

const BEARER_TOKEN = /^Bearer ([A-Za-z0-9\-_.]{1,2048})$/;

const unauthorized = () =>
  new AppError(401, "UNAUTHORIZED", "Sessão inválida ou expirada. Entre novamente.");

const forbidden = () =>
  new AppError(403, "FORBIDDEN", "Você não tem permissão para esta ação.");

// A cada requisição confere conta, papel, versão da senha e logout no banco: excluir a conta,
// retirar o admin, trocar a senha ou sair valem na hora, sem esperar o token expirar.
export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = BEARER_TOKEN.exec(req.headers.authorization ?? "")?.[1];
  const session = token ? readToken(token) : null;

  if (!session) throw unauthorized();

  const user = await new PrismaUsersRepository().findById(session.userId);

  if (!user || user.tokenVersion !== session.tokenVersion || (await isRevoked(session.jti))) {
    throw unauthorized();
  }

  (req as any).user = { id: user.id, admin: user.admin };
  (req as any).session = session;

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
