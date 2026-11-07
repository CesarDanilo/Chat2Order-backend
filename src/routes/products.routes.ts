import { Router } from "express";
import { ProductsController } from "../controllers/products.controller";
import { authMiddleware } from "../middleware/authUser";
import { validate } from "../middleware/validate";
import { idParams, paginationQuery } from "../schemas/common";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";

const router = Router();
const productsController = new ProductsController();

router.get("/product", authMiddleware, validate({ query: paginationQuery }), productsController.GetProductsByUser);
router.get("/product/:id", authMiddleware, validate({ params: idParams }), productsController.GetProductById);
router.post("/product", authMiddleware, validate({ body: createProductSchema }), productsController.CreateProducts);
router.put("/product/:id", authMiddleware, validate({ params: idParams, body: updateProductSchema }), productsController.UpdateProducts);
router.delete("/product/:id", authMiddleware, validate({ params: idParams }), productsController.DeleteProduct);

export default router;
