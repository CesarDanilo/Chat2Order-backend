import { Product } from "@prisma/client";
import { Pagination } from "../shared/validation/common";

export interface CreateProducts {
  userId: string;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  available?: boolean;
}

export interface UpdateProducts {
  name?: string;
  description?: string | null;
  price?: number;
  category?: string | null;
  available?: boolean;
}

// Todo acesso por id exige o dono: não existe consulta de produto sem ownerId.
export interface IProductRepository {
  create(data: CreateProducts): Promise<Product>;
  findAllByUser(userId: string, pagination: Pagination): Promise<Product[]>;
  countByUser(userId: string): Promise<number>;
  findByIdForOwner(productId: string, ownerId: string): Promise<Product | null>;
  updateForOwner(
    productId: string,
    ownerId: string,
    data: UpdateProducts,
  ): Promise<Product | null>;
  deleteForOwner(productId: string, ownerId: string): Promise<Product | null>;
}
