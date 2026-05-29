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

// src/repository/FakeOrdersRepository.ts
var FakeOrdersRepository_exports = {};
__export(FakeOrdersRepository_exports, {
  FakeOrdersRepository: () => FakeOrdersRepository
});
module.exports = __toCommonJS(FakeOrdersRepository_exports);
var import_node_crypto = require("crypto");
var FakeOrdersRepository = class {
  constructor() {
    this.orders = [];
  }
  async create(data) {
    const newOrder = {
      id: (0, import_node_crypto.randomUUID)(),
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address,
      paymentMethod: data.paymentMethod,
      status: data.status,
      total: data.total,
      source: data.source,
      rawMessage: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    const orderWithItems = {
      ...newOrder,
      items: data.items.map((item) => ({
        id: (0, import_node_crypto.randomUUID)(),
        orderId: newOrder.id,
        ...item
      }))
    };
    this.orders.push(orderWithItems);
    return newOrder;
  }
  async findMany(userId) {
    const userOrders = this.orders.filter((o) => o.userId === userId);
    return userOrders.length > 0 ? userOrders : [];
  }
  async delete(id) {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    const deleted = this.orders[index];
    this.orders.splice(index, 1);
    return deleted;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FakeOrdersRepository
});
