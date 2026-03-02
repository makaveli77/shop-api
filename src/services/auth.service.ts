import { db } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserQueries from '../queries/user.queries';
import { LoginInput, AuthResponse, User } from '../types';

interface CustomError extends Error {
  status?: number;
}

const AuthService = {
  async login({ username, password }: LoginInput): Promise<AuthResponse> {
    // Find user by username
    const { rows } = await db.query<User>(UserQueries.findByUsername, [username]);
    const user = rows[0];

    if (!user) {
      const error: CustomError = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error: CustomError = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Update last_login timestamp using repository
    const userRepository = require('../repositories/user.repository').default;
    await userRepository.updateLastLogin(user.id);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const token = jwt.sign(
      { id: user.id, username: user.username },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    return { token };
  }
};

export default AuthService;
