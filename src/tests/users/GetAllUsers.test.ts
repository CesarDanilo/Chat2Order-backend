import { UserController } from "../../controllers/user.controller";

describe('UserController - GetAllUsersController', () => {
  it('should return 200 and users list', async () => {
    const req: any = {
      query: {},
      params: {},
      body: {},
    };

    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const userController = new UserController();
    await userController.GetAllUsersController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});