import { IProductRepository, CreateProducts, UpdateProducts } from "../interfaces/IProductsRepository";
import { Pagination } from "../shared/validation/common";


export class ProductServices {
    constructor(private productRepository: IProductRepository) { }

    async CreateProducts(data: CreateProducts, userId: string) {
        data.userId = userId;
        return await this.productRepository.create(data);
    }

    async GetProductsByUser(userId: string, pagination: Pagination) {
        const [products, total] = await Promise.all([
            this.productRepository.findAllByUser(userId, pagination),
            this.productRepository.countByUser(userId),
        ]);

        return { products, total };
    }

    async UpdateProduct(id: string, ownerId: string, data: UpdateProducts) {
        return await this.productRepository.updateForOwner(id, ownerId, data);
    }

    async GetProductById(id: string, ownerId: string) {
        return await this.productRepository.findByIdForOwner(id, ownerId);
    }

    async DeleteProductById(id: string, ownerId: string) {
        return await this.productRepository.deleteForOwner(id, ownerId);
    }
}
