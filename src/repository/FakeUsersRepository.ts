import {
  IUserRepository,
  CreateUserDTO
} from "../interfaces/IUserRepository";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

export class FakeUsersRepository
  implements IUserRepository {

  private users: User[] = [];

  async create(data: CreateUserDTO) {

    const user: User = {
      id: crypto.randomUUID(),
      ...data,
    };

    this.users.push(user);

    return user;
  }

  async findByEmail(email: string) {

    const user = this.users.find(
      user => user.email === email
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