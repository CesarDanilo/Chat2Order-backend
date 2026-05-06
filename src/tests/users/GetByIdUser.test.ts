import { UserController } from "../../controllers/user.controller";
import { UserService } from "../../services/user.service";

describe('UserController - GetByIdController', () => {
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
      password: "123456789",
      createdAt: new Date()
    };

    jest.spyOn(UserService.prototype, 'GetUserById')
      .mockResolvedValue(fakeUser);

    const userController = new UserController();

    await userController.GetUserByIdController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });
});