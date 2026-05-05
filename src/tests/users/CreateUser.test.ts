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
        password: 'password',
        createdAt: new Date()
      } );

    const userController = new UserController();
    await userController.CreateUserController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });
});