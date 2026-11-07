import { randomUUID } from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { log } from "../logger";

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{1,64}$/;

type RequestLogInput = {
  requestId: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  userId?: string;
};

// Só metadados: a query fica de fora porque pode carregar dados pessoais.
export function requestLogEntry({ requestId, method, url, status, durationMs, userId }: RequestLogInput) {
  return {
    level: status >= 500 ? ("error" as const) : ("info" as const),
    message: "request",
    requestId,
    method,
    path: url.split("?")[0],
    status,
    durationMs: Math.round(durationMs),
    ...(userId ? { userId } : {}),
  };
}

// Reaproveita o id enviado pelo proxy ou cliente, se for seguro, para cruzar logs entre serviços.
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const incoming = req.get("X-Request-Id");
  const requestId = incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
  const startedAt = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const { level, message, ...fields } = requestLogEntry({
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
      userId: (req as any).user?.id,
    });

    log(level, message, fields);
  });

  next();
}
