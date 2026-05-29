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

// src/services/auth/AuthenticateUserService.ts
var AuthenticateUserService_exports = {};
__export(AuthenticateUserService_exports, {
  AuthenticateUserService: () => AuthenticateUserService
});
module.exports = __toCommonJS(AuthenticateUserService_exports);
var import_bcrypt = __toESM(require("bcrypt"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var AuthenticateUserService = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute(email, password) {
    try {
      const user = await this.usersRepository.findByEmail(email);
      if (!user) throw new Error("Invalid credentials");
      const passwordMatch = await import_bcrypt.default.compare(password, user.password);
      if (!passwordMatch) throw new Error("Invalid credentials");
      const token = import_jsonwebtoken.default.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return {
        user: {
          "id": user.id,
          "name": user.name,
          "email": user.email,
          "admin": user.admin
        },
        token
      };
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthenticateUserService
});
