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

// src/config/swagger.ts
var swagger_exports = {};
__export(swagger_exports, {
  swaggerOptions: () => swaggerOptions
});
module.exports = __toCommonJS(swagger_exports);
var swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat2Order API",
      version: "1.0.0",
      description: "Documenta\xE7\xE3o da API do Chat2Order"
    },
    servers: [
      {
        url: "http://localhost:3000"
      }
    ]
  },
  apis: ["./src/**/*.ts"]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  swaggerOptions
});
