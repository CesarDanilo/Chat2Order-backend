import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { noQuery } from "../validation/common";

type Schemas = {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
};

type Issue = z.core.$ZodIssue;
type Detail = { field: string; code: string; message: string };

const SIZE_CODES: Record<string, { min: string; max: string }> = {
  string: { min: "MIN_LENGTH", max: "MAX_LENGTH" },
  array: { min: "MIN_ITEMS", max: "MAX_ITEMS" },
  number: { min: "MIN_VALUE", max: "MAX_VALUE" },
};

const valueAt = (input: unknown, path: PropertyKey[]) =>
  path.reduce<any>((value, key) => value?.[key], input);

function codeOf(issue: Issue, input: unknown) {
  switch (issue.code) {
    case "invalid_type":
      return valueAt(input, issue.path) === undefined ? "REQUIRED" : "INVALID_TYPE";
    case "too_small":
      return SIZE_CODES[issue.origin]?.min ?? "MIN_VALUE";
    case "too_big":
      return SIZE_CODES[issue.origin]?.max ?? "MAX_VALUE";
    case "invalid_format":
      return "INVALID_FORMAT";
    default:
      return "INVALID_VALUE";
  }
}

function toDetails(issue: Issue, input: unknown): Detail[] {
  if (issue.code === "unrecognized_keys") {
    return issue.keys.map((key) => ({
      field: [...issue.path, key].join("."),
      code: "UNKNOWN_FIELD",
      message: "Campo não permitido",
    }));
  }

  return [
    {
      field: issue.path.join("."),
      code: codeOf(issue, input),
      message: issue.message,
    },
  ];
}

function rejectInvalid(res: Response, issues: Issue[], input: unknown) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "Existem campos inválidos.",
      details: issues.flatMap((issue) => toDetails(issue, input)),
    },
  });
}

// Valida a entrada antes do controller. Rota sem schema de query recusa qualquer query.
export function validate({ body, params, query = noQuery }: Schemas = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsedQuery = query.safeParse(req.query);
    if (!parsedQuery.success) return rejectInvalid(res, parsedQuery.error.issues, req.query);

    res.locals.query = parsedQuery.data;

    if (params) {
      const result = params.safeParse(req.params);
      if (!result.success) return rejectInvalid(res, result.error.issues, req.params);
    }

    if (body) {
      const input = req.body ?? {};
      const result = body.safeParse(input);
      if (!result.success) return rejectInvalid(res, result.error.issues, input);

      req.body = result.data;
    }

    next();
  };
}
