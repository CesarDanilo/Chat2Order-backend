import { User } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  IUserRepository,
  CreateUserDTO
} from "../interfaces/IUserRepository";

export class FakeUsersRepository
  implements IUserRepository {

  private users: User[] = [];

  async create(data: CreateUserDTO) {

    const user: User = {
      id: randomUUID(),
      admin: false,
      tokenVersion: 0,
      ...data,
    };

    this.users.push(user);

    return user;
  }

  async findByEmail(email: string) {

    const user = this.users.find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    return user || null;
  }

  async findById(id: string) {

    const user = this.users.find(
      user => user.id === id
    );

    return user || null;
  }
}
