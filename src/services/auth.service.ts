import { db } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserQueries from '../queries/user.queries';
import { LoginInput, AuthResponse, User } from '../types';
import { sendResetPasswordEmail } from './mail.service';
import UserRepository from '../repositories/user.repository';

interface CustomError extends Error {
  status?: number;
}

const AuthService = {
  async login({ username, password }: LoginInput): Promise<AuthResponse> {
    // Find user by username
    
    const { rows } = await db.query<User>(UserQueries.findByUsername, [username]);
    const foundUser = rows[0];

    if (!foundUser) {
      const error: CustomError = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    if (foundUser.is_locked) {
      const error: CustomError = new Error('Account is locked. Please contact support.');
      error.status = 403;
      throw error;
    }

    if (!foundUser.is_verified) {
      const error: CustomError = new Error('Account is not verified. Please check your email.');
      error.status = 403;
      throw error;
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, foundUser.password_hash);
    if (!isPasswordValid) {
      const error: CustomError = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    // Update last_login timestamp using repository
    await UserRepository.updateLastLogin(foundUser.id);

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const token = jwt.sign(
      { id: foundUser.id, username: foundUser.username },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    return { token };
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Generate reset token (short lived JWT)
    const secret = process.env.JWT_SECRET || 'secret';
    // Create a special secret for password reset that involves the user's current password hash
    // This way, if the password is changed, the token is automatically invalidated!
    const resetSecret = secret + user.password_hash;
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      resetSecret,
      { expiresIn: '15m' }
    );

    // Send email
    await sendResetPasswordEmail(user.email, token);
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Decode token without verification first to get the user ID
    const decoded = jwt.decode(token) as { id: number, email: string } | null;
    
    if (!decoded || !decoded.id) {
      const error: CustomError = new Error('Invalid or expired token');
      error.status = 400;
      throw error;
    }

    const user = await UserRepository.findById(decoded.id);
    if (!user) {
      const error: CustomError = new Error('Invalid or expired token');
      error.status = 400;
      throw error;
    }

    // Verify token with the user-specific secret
    const secret = process.env.JWT_SECRET || 'secret';
    const resetSecret = secret + user.password_hash;

    try {
      jwt.verify(token, resetSecret);
    } catch (err) {
      const error: CustomError = new Error('Invalid or expired token');
      error.status = 400;
      throw error;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await UserRepository.updatePassword(user.id, hashedPassword);
  }
};

export default AuthService;
