jest.mock("../../config/prisma", () => ({ prisma: {} }));

import { UserController } from "../../controllers/user.controller";
import { UserService } from "../../services/user.service";

describe('Create User', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('create', async () => {
    const req: any = { 
      body: {
        name: 'test',
        email: 'test@test.com',
        password: 'password'
      }
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest
      .spyOn(UserService.prototype, 'createUser')
      .mockResolvedValueOnce({
        id: '1',
        name: 'test',
        email: 'test@test.com',
        createdAt: new Date(),
        admin: false
      } );

    const userController = new UserController();
    await userController.CreateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it("should delete a user", async () => {
    
    const req = {
      query: {},
      params: { id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91" },
      body: {},
    } as any;

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const fakeUser = {
      id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91",
      name: "cesar",
      email: "cesar@gmail.com",
      createdAt: new Date(),
      admin: false
    };

    jest.spyOn(UserService.prototype, 'DeleteUserById')
      .mockResolvedValue(fakeUser);

    const controller = new UserController();
    await controller.DeleteUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(204);                                 
  });

  it('should return 200 and users list', async () => {
    const req: any = {
      query: {},
      params: {},
      body: {},
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      locals: { query: { page: 1, limit: 500 } }
    };

    jest.spyOn(UserService.prototype, 'GetAllUsers').mockResolvedValue({ users: [], total: 0 });

    const userController = new UserController();
    await userController.GetAllUsersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it('should return 200 and user data', async () => {
    const req = {
      query: {},
      params: { id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91" },
      body: {},
    } as any;

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const fakeUser = {
      id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91",
      name: "cesar",
      email: "cesar@gmail.com",
      createdAt: new Date(),
      admin: false
    };

    jest.spyOn(UserService.prototype, 'GetUserById')
      .mockResolvedValue(fakeUser);

    const userController = new UserController();

    await userController.GetUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });

  it('Deve retornar 200 e o usuário atualizado', async () => {

    const userData = {
      name: 'João',
      email: 'joao@email',
      password: '123456',
      createdAt: new Date(),
      admin: false
    };

    const req: any = {
      params: { id: '1' },
      body: userData
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.spyOn(UserService.prototype, 'UpdateUserById')
      .mockResolvedValue({
        id: '1',
        name: userData.name,
        email: userData.email,
        createdAt: userData.createdAt,
        admin: false,
      });

    const userController = new UserController();

    await userController.UpdateUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      id: '1',
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt,
      admin: false,
    });
  });

  it('Deve retornar 404 se o usuário não for encontrado', async () => {

    const userData = {
      name: 'João',
      email: 'joao@email',
      password: '123456',
    };

    const req: any = {
      params: { id: '1' },
      body: userData
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.spyOn(UserService.prototype, 'UpdateUserById')
      .mockRejectedValue(new Error('User not found'));

    const userController = new UserController();

    await expect(userController.UpdateUserByIdController(req, res)).rejects.toThrow('User not found');
    expect(res.json).not.toHaveBeenCalled();
  });

  it('Deve retornar 500 em erro interno do servidor', async () => {

    const userData = {
      name: 'João',
      email: 'joao@email',
      password: '123456',
    };

    const req: any = {
      params: { id: '1' },
      body: userData
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.spyOn(UserService.prototype, 'UpdateUserById')
      .mockRejectedValue(new Error('Erro interno'));

    const userController = new UserController();

    await expect(userController.UpdateUserByIdController(req, res)).rejects.toThrow('Erro interno');
    expect(res.json).not.toHaveBeenCalled();
  });
});