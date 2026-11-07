import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { PrismaProductsRepository } from "../repository/PrismaProductsRepository";
import { ProductServices } from "../services/products.service";

const productNotFound = () => new AppError(404, "NOT_FOUND", "Produto não encontrado");

const createService = () => new ProductServices(new PrismaProductsRepository());

const ownerOf = (req: Request): string => (req as any).user.id;

const productId = (req: Request) => String(req.params.id);

export class ProductsController {
    async CreateProducts(req: Request, res: Response) {
        const product = await createService().CreateProducts(req.body, ownerOf(req));

        return res.json(product);
    }

    async GetProductsByUser(req: Request, res: Response) {
        const { products, total } = await createService().GetProductsByUser(ownerOf(req), res.locals.query);

        res.setHeader("X-Total-Count", total);

        return res.json(products);
    }

    async UpdateProducts(req: Request, res: Response) {
        const product = await createService().UpdateProduct(productId(req), ownerOf(req), req.body);

        if (!product) throw productNotFound();

        return res.json(product);
    }

    async GetProductById(req: Request, res: Response) {
        const product = await createService().GetProductById(productId(req), ownerOf(req));

        if (!product) throw productNotFound();

        return res.json(product);
    }

    async DeleteProduct(req: Request, res: Response) {
        const product = await createService().DeleteProductById(productId(req), ownerOf(req));

        if (!product) throw productNotFound();

        return res.json(product);
    }
}
