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

// src/services/order.service.ts
var order_service_exports = {};
__export(order_service_exports, {
  OrderService: () => OrderService
});
module.exports = __toCommonJS(order_service_exports);
var OrderService = class {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }
  async GetOrderByUserId(userId) {
    return await this.orderRepository.findManyByUserId(userId);
  }
  async GetOrderById(orderId) {
    return await this.orderRepository.findById(orderId);
  }
  async CreateOrder(data, userId) {
    data.userId = userId;
    return await this.orderRepository.create(data);
  }
  async UpdateOrder(orderId, data) {
    return await this.orderRepository.update(orderId, data);
  }
  async DeleteOrder(id) {
    return await this.orderRepository.delete(id);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OrderService
});
