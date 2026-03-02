import request from 'supertest';
import app from '../app';
import { db } from '../config/db';
import bcrypt from 'bcryptjs';
import UserRepository from '../repositories/user.repository';

// Mock the database pool
jest.mock('../config/db');
jest.mock('../repositories/user.repository');

const mockedDb = db as jest.Mocked<typeof db>;
const mockedUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;

describe('Auth API - POST /login', () => {
  const password = 'password123';
  const hashedPassword = bcrypt.hashSync(password, 10);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and a JWT token if credentials are valid', async () => {
    // Mock DB to return a valid user
    mockedDb.query.mockResolvedValue({
      rows: [{
        id: 1,
        username: 'admin',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        registration_date: new Date().toISOString(),
        last_login: null
      }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    mockedUserRepository.updateLastLogin.mockResolvedValue(undefined);

    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'password123' });

    // Assertions
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should return 401 if the password does not match', async () => {
    mockedDb.query.mockResolvedValue({
      rows: [{
        id: 1,
        username: 'admin',
        password_hash: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        registration_date: new Date().toISOString(),
        last_login: null
      }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    } as any);

    const res = await request(app)
      .post('/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 401 if the user is not found', async () => {
    // Mock DB to return no rows
    mockedDb.query.mockResolvedValue({ 
      rows: [],
      command: '',
      rowCount: 0,
      oid: 0,
      fields: []
    } as any);

    const res = await request(app)
      .post('/login')
      .send({ username: 'ghost', password: 'somepassword' });

    if (res.statusCode === 400) console.log('Joi Error:', res.body.errors);
    
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for protected routes if token is missing', async () => {
    const res = await request(app).get('/articles');
    
    expect(res.statusCode).toBe(401); 
    expect(res.body.error).toBe('Token missing');
  });

  it('should return 403 for protected routes if token is invalid', async () => {
    const res = await request(app)
      .get('/articles')
      .set('Authorization', 'Bearer invalid_token_here');
    
    expect(res.statusCode).toBe(403); 
    expect(res.body.error).toBe('Invalid token');
  });
});
