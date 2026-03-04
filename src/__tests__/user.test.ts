import request from 'supertest';
import app from '../app';
import UserRepository from '../repositories/user.repository';

// Mock the repository
jest.mock('../repositories/user.repository');

const mockedUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;

describe('User API - POST /register', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 201 and user data if registration is successful', async () => {
    // Mock repository to return no existing user
    mockedUserRepository.findByEmailOrUsername.mockResolvedValueOnce(undefined);
    
    // Mock repository to return the new user after insert
    mockedUserRepository.create.mockResolvedValueOnce({
      id: 2,
      username: 'newuser',
      email: 'new@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User',
      registration_date: new Date(),
      last_login: null,
      is_locked: false
    });

    const res = await request(app)
      .post('/register')
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.username).toBe('newuser');
    expect(res.body.user.email).toBe('new@example.com');
    expect(res.body.user.first_name).toBe('Test');
    expect(res.body.user.last_name).toBe('User');
    expect(res.body.user).toHaveProperty('registration_date');
    expect(res.body.user).toHaveProperty('last_login');
    expect(res.body).toHaveProperty('message', 'User registered successfully. Please check your email to verify your account.');
  });

  it('should return 409 if username or email already exists', async () => {
    // Mock repository to return an existing user
    mockedUserRepository.findByEmailOrUsername.mockResolvedValueOnce({
      id: 1,
      username: 'admin',
      email: 'admin@example.com',
      password_hash: 'hashedpassword',
      first_name: 'Admin',
      last_name: 'User',
      registration_date: new Date(),
      last_login: null,
      is_locked: false
    });


    const res = await request(app)
      .post('/register')
      .send({
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123',
        first_name: 'Admin',
        last_name: 'User'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty('message', 'Username or Email already exists');
  });

  it('should return 400 if validation fails', async () => {

    const res = await request(app)
      .post('/register')
      .send({
        username: '',
        email: 'not-an-email',
        password: '123',
        first_name: '',
        last_name: ''
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });
});
