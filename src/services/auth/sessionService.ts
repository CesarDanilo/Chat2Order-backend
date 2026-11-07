import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../../shared/database/prisma";

const SESSION_DURATION = "1d";

export type SessionClaims = {
  userId: string;
  tokenVersion: number;
  jti?: string;
  expiresAt?: Date;
};

export function issueToken(userId: string, tokenVersion: number) {
  return jwt.sign({ sub: userId, ver: tokenVersion }, process.env.JWT_SECRET as string, {
    expiresIn: SESSION_DURATION,
    algorithm: "HS256",
    jwtid: randomUUID(),
  });
}

// Devolve null para qualquer token inválido, sem dizer o motivo.
export function readToken(token: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });

    if (typeof payload !== "object" || typeof payload.sub !== "string") return null;

    return {
      userId: payload.sub,
      tokenVersion: typeof payload.ver === "number" ? payload.ver : 0,
      jti: payload.jti,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
    };
  } catch {
    return null;
  }
}

export async function isRevoked(jti?: string) {
  if (!jti) return false;

  return (await prisma.revokedToken.count({ where: { jti } })) > 0;
}

export async function revoke({ jti, expiresAt }: SessionClaims) {
  if (!jti || !expiresAt) return;

  await prisma.$transaction([
    prisma.revokedToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.revokedToken.upsert({ where: { jti }, create: { jti, expiresAt }, update: {} }),
  ]);
}
