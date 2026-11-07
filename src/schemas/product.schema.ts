import { z } from "zod";
import { LIMITS, money, text } from "../shared/validation/common";

const productFields = {
  name: text({ label: "o nome do produto", max: LIMITS.productName }),
  description: text({
    label: "a descrição",
    min: 0,
    max: LIMITS.description,
    multiline: true,
  }).nullish(),
  category: text({ label: "a categoria", min: 0, max: LIMITS.category }).nullish(),
  price: money("O preço").refine((value) => value > 0, "O preço deve ser maior que 0"),
  available: z.boolean("Valor inválido para disponibilidade").optional(),
};

export const createProductSchema = z.strictObject(productFields);

export const updateProductSchema = z
  .strictObject(productFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Informe ao menos um campo");
