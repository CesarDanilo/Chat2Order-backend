import bcrypt from "bcrypt";
import { FakeUsersRepository } from "../../repository/FakeUsersRepository"; 
import { AuthenticateUserService } from "../../services/auth/AuthenticateUserService";

describe('AuthenticateUserService', () => {

  beforeAll(() => {
    process.env.JWT_SECRET = "urjihnfklwgybuhqt";
  })

  it('should authenticate user', async() => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);

    const hashedPassword = await bcrypt.hash("123456", 10);

    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: new Date()
    });

    const auth = await authenticateUserService.execute("cesardanilopalacios390@gmail.com", "123456");

    expect(auth).toHaveProperty("token");
  })

  it('should not authenticate with invalid email', async() => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);

    const hashedPassword = await bcrypt.hash("123456", 10);

    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: new Date()
    });

    await expect(authenticateUserService.execute("invalid@gmail.com", "123456")).rejects.toThrow("Invalid credentials")
  })

  it('should not authenticate with invalid password', async() => {
    const userRepository = new FakeUsersRepository();
    const authenticateUserService = new AuthenticateUserService(userRepository);

    const hashedPassword = await bcrypt.hash("123456", 10);
    
    await userRepository.create({
      name: "Cesar",
      email: "cesardanilopalacios390@gmail.com",
      password: hashedPassword,
      createdAt: new Date()
    });

    await expect(authenticateUserService.execute("cesardanilopalacios390@gmail.com", "0000")).rejects.toThrow("Invalid credentials")
  })
})