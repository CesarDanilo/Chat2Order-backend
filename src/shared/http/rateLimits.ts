import { Request } from "express";
import rateLimit from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

const limitOptions = {
  windowMs: FIFTEEN_MINUTES,
  standardHeaders: true,
  legacyHeaders: false,
};

const tooMany = (message: string) => ({ error: { code: "RATE_LIMITED", message } });

export const globalLimiter = rateLimit({
  ...limitOptions,
  limit: 300,
  message: tooMany("Muitas requisições. Tente novamente mais tarde."),
});

// Só tentativas erradas contam, para não bloquear quem entra normalmente.
export const loginLimiter = rateLimit({
  ...limitOptions,
  limit: 10,
  skipSuccessfulRequests: true,
  message: tooMany("Muitas tentativas de login. Tente novamente em alguns minutos."),
});

// Só cadastros concluídos contam: erros de formulário não consomem o limite.
export const registerLimiter = rateLimit({
  ...limitOptions,
  windowMs: ONE_HOUR,
  limit: 10,
  skipFailedRequests: true,
  message: tooMany("Muitos cadastros a partir desta rede. Tente novamente mais tarde."),
});

// Cada chamada consome a chave da IA, então o limite é por conta, não por IP.
export const parseLimiter = rateLimit({
  ...limitOptions,
  limit: 20,
  keyGenerator: (req: Request) => (req as any).user.id,
  message: tooMany("Limite de importações atingido. Tente novamente em alguns minutos."),
});
