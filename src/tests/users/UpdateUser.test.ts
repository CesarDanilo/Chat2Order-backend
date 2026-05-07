import { UserController } from "../../controllers/user.controller";
import { UserService } from "../../services/user.service";

describe('UserController - UpdateUserByIdController', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('Deve retornar 200 e o usuário atualizado', async () => {

    const userData = {
      name: 'João',
      email: 'joao@email',
      password: '123456',
      createdAt: new Date()
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
      .mockResolvedValue({ id: '1', ...userData });

    const userController = new UserController();

    await userController.UpdateUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith({
      id: '1',
      name: userData.name,
      email: userData.email,
      password: userData.password,
      createdAt: userData.createdAt,
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

    await userController.UpdateUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: 'User not found'
    });
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

    await userController.UpdateUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: 'Erro interno'
    });
  });
});