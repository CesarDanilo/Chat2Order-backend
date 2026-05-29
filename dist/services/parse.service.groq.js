"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/parse.service.groq.ts
var parse_service_groq_exports = {};
__export(parse_service_groq_exports, {
  ParserService: () => ParserService
});
module.exports = __toCommonJS(parse_service_groq_exports);

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/services/parse.service.groq.ts
var import_groq_sdk = __toESM(require("groq-sdk"));
var ParserService = class {
  async execute(message, userId) {
    const groq = new import_groq_sdk.default({ apiKey: process.env.GROQ_API_KEY });
    async function getGroqChatCompletion(message2) {
      return groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endere\xE7o","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endere\xE7o, use 'N/A'; Retorne apenas o c\xF3digo, sem textos explicativos. Responda apenas com o JSON purificado. N\xE3o use blocos c\xF3digo markdown. Conversa: ` + message2
          }
        ],
        model: "llama-3.1-8b-instant"
      });
    }
    try {
      const chatCompletion = await getGroqChatCompletion(message);
      const response = chatCompletion.choices[0]?.message?.content || "{}";
      const parsedData = JSON.parse(response || "{}");
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
      console.error("Erro completo:", error);
      if (error.status === 503) {
        throw new Error(
          "A IA est\xE1 temporariamente sobrecarregada. Tente novamente em alguns segundos."
        );
      }
      if (error instanceof SyntaxError) {
        console.error("Erro ao fazer parse do JSON:", error.message);
        throw new Error("Resposta da IA em formato inv\xE1lido. Tente novamente.");
      }
      if (error.code === "P2002" || error.code === "P2003") {
        throw new Error("Erro ao salvar pedido no banco de dados.");
      }
      console.error("Stack trace:", error.stack);
      throw new Error(`Erro ao processar mensagem com IA: ${error.message}`);
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ParserService
});
