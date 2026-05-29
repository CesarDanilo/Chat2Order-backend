"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/parse.service.gemini.ts
var parse_service_gemini_exports = {};
__export(parse_service_gemini_exports, {
  ParserService: () => ParserService
});
module.exports = __toCommonJS(parse_service_gemini_exports);

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/services/parse.service.gemini.ts
var import_genai = require("@google/genai");
var ParserService = class {
  async execute(message, userId) {
    try {
      const ai = new import_genai.GoogleGenAI({});
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endere\xE7o","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endere\xE7o, use 'N/A'; Retorne apenas o c\xF3digo, sem textos explicativos. Responda apenas com o JSON purificado. N\xE3o use blocos de c\xF3digo markdown. Conversa: ` + message
      });
      const parsedData = JSON.parse(response.text || "{}");
      const order = await prisma.order.create({
        data: {
          userId,
          customerName: parsedData.customerName || "sem nome",
          customerPhone: parsedData.customerPhone || "(00) 0 0000-0000",
          address: parsedData.address || "sem endere\xE7o",
          paymentMethod: parsedData.paymentMethod || "PIX",
          status: "PENDENTE",
          total: parsedData.total,
          source: "WHATSAPP",
          rawMessage: message,
          items: {
            create: parsedData.items
          }
        },
        include: {
          items: true
        }
      });
      return order;
    } catch (error) {
      if (error.status === 503) {
        throw new Error(
          "A IA est\xE1 temporariamente sobrecarregada. Tente novamente em alguns segundos."
        );
      }
      throw new Error("Erro ao processar mensagem com IA.");
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserService
});
