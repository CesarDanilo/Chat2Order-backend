import { User } from "@prisma/client";

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

export interface IUserRepository {
  
  create(data: CreateUserDTO): Promise<User>;

  findByEmail(email: string): Promise<User | null>;

  findById(id: string): Promise<User | null>;
}