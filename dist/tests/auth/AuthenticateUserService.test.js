"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/tests/auth/AuthenticateUserService.test.ts
var import_bcrypt2 = __toESM(require("bcrypt"));

// src/repository/FakeUsersRepository.ts
var FakeUsersRepository = class {
  constructor() {
    this.users = [];
  }
  async create(data) {
    const user = {
      id: crypto.randomUUID(),
      ...data
    };
    this.users.push(user);
    return user;
  }
  async findByEmail(email) {
    const user = this.users.find(
      (user2) => user2.email === email
    );
    return user || null;
  }
  async findById(id) {
    const user = this.users.find(
      (user2) => user2.id === id
    );
    return user || null;
  }
};

// src/services/auth/AuthenticateUserService.ts
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

// src/tests/auth/AuthenticateUserService.test.ts
describe("AuthenticateUserService", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "urjihnfklwgybuhqt";
  });
  it("should authenticate user", async () => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);
    const hashedPassword = await import_bcrypt2.default.hash("123456", 10);
    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: /* @__PURE__ */ new Date()
    });
    const auth = await authenticateUserService.execute("cesardanilopalacios390@gmail.com", "123456");
    expect(auth).toHaveProperty("token");
  });
  it("should not authenticate with invalid email", async () => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);
    const hashedPassword = await import_bcrypt2.default.hash("123456", 10);
    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: /* @__PURE__ */ new Date()
    });
    await expect(authenticateUserService.execute("invalid@gmail.com", "123456")).rejects.toThrow("Invalid credentials");
  });
  it("should not authenticate with invalid password", async () => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);
    const hashedPassword = await import_bcrypt2.default.hash("123456", 10);
    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: /* @__PURE__ */ new Date()
    });
    await expect(authenticateUserService.execute("cesardanilopalacios390@gmail.com", "0000")).rejects.toThrow("Invalid credentials");
  });
});
