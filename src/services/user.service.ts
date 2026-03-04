import userRepository from '../repositories/user.repository';
import UserDTO from '../dtos/user.dto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CreateUserInput, UpdateUserInput, UserStats } from '../types';
import { sendVerificationEmail } from './mail.service';

interface CustomError extends Error {
  status?: number;
}

const UserService = {
  async register({ username, email, password, first_name, last_name, address, phone_number, date_of_birth, city, country_code, ip_address }: CreateUserInput) {
    // Check for existing user
    const existingUser = await userRepository.findByEmailOrUsername(email, username);
    if (existingUser) {
      const error: CustomError = new Error('Username or Email already exists');
      error.status = 409;
      throw error;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Save to DB
    const newUser = await userRepository.create({ 
      username, email, password_hash, first_name, last_name,
      address, phone_number, date_of_birth, city, country_code, ip_address
    });

    // Generate Verification Token (JWT)
    const secret = process.env.JWT_SECRET || 'secret';
    const verification_token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      secret,
      { expiresIn: '24h' }
    );

    // Send Verification Email
    await sendVerificationEmail(email, verification_token);

    return UserDTO.toResponse(newUser);
  },

  async verifyEmail(token: string) {
    try {
      const secret = process.env.JWT_SECRET || 'secret';
      const decoded = jwt.verify(token, secret) as { id: number, email: string };
      
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        const error: CustomError = new Error('User not found');
        error.status = 404;
        throw error;
      }

      if (user.is_verified) {
        return { message: 'Email already verified' };
      }

      await userRepository.verifyEmail(user.id);
      return { message: 'Email verified successfully' };
    } catch (err) {
      const error: CustomError = new Error('Invalid or expired verification token');
      error.status = 400;
      throw error;
    }
  },

  async updateLastLogin(userId: number): Promise<void> {
    await userRepository.updateLastLogin(userId);
  },

  async getUser(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return UserDTO.toResponse(user);
  },

  async updateUser(id: number, data: UpdateUserInput) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error: CustomError = new Error('User not found');
      error.status = 404;
      throw error;
    }
    const updatedUser = await userRepository.update(id, data);
    return UserDTO.toResponse(updatedUser);
  },

  async lockUser(id: number) {
    const user = await userRepository.findById(id);
    if (!user) {
        const error: CustomError = new Error('User not found');
        error.status = 404;
        throw error;
    }
    const lockedUser = await userRepository.lock(id);
    return UserDTO.toResponse(lockedUser);
  },

  async getStats(userId: number): Promise<UserStats> {
    const user = await userRepository.findById(userId);
    if (!user) {
        const error: CustomError = new Error('User not found');
        error.status = 404;
        throw error;
    }
    try {
      const stats = await userRepository.getStats(userId);
      // If no wallet exists, return empty stats
      if (!stats) {
        return {
          balance: 0,
          currency: 'USD',
          total_deposited: 0,
          total_withdrawn: 0,
          total_spent: 0,
          recent_transactions: []
        };
      }
      return stats;
    } catch (error) {
       console.error("Error fetching user stats:", error);
       throw error;
    }
  }
};

export default UserService;
