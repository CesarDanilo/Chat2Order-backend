// src/config/swagger.ts

import { Options } from "swagger-jsdoc";

export const swaggerOptions: Options = {

  definition: {
    openapi: "3.0.0",

    info: {
      title: "Chat2Order API",
      version: "1.0.0",
      description: "Documentação da API do Chat2Order",
    },

    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
  },

  apis: ["./src/**/*.ts"],
};