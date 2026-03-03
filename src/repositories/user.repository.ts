import { db } from '../config/db';
import UserQueries from '../queries/user.queries';
import WalletQueries from '../queries/wallet.queries';
import { User, UpdateUserInput, UserStats } from '../types';

interface CreateUserData {
  username: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone_number?: string;
  date_of_birth?: string | Date;
  city?: string;
  country_code?: string;
  ip_address?: string;
}

class UserRepository {
  async findByEmailOrUsername(email: string, username: string): Promise<User | undefined> {
    const result = await db.query<User>(UserQueries.findByEmailOrUsername, [email, username]);
    return result.rows[0];
  }

  async findById(id: number): Promise<User | undefined> {
    const result = await db.query<User>(UserQueries.findById, [id]);
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const query = UserQueries.findByEmail || 'SELECT * FROM "user" WHERE email = $1';
    const result = await db.query<User>(query, [email]);
    return result.rows[0];
  }

  async updatePassword(id: number, passwordHash: string): Promise<void> {
    const query = UserQueries.updatePassword || 'UPDATE "user" SET password_hash = $1 WHERE id = $2';
    await db.query(query, [passwordHash, id]);
  }

  async update(id: number, userData: UpdateUserInput): Promise<User> {
    const result = await db.query<User>(UserQueries.update, [
      id,
      userData.first_name || null,
      userData.last_name || null,
      userData.address || null,
      userData.phone_number || null,
      userData.date_of_birth || null,
      userData.city || null,
      userData.country_code?.toUpperCase() || null
    ]);
    return result.rows[0];
  }

  async lock(id: number): Promise<User> {
    const result = await db.query<User>(UserQueries.lock, [id]);
    return result.rows[0];
  }

  async getStats(userId: number): Promise<UserStats> {
    const result = await db.query<UserStats>(UserQueries.getStats, [userId]);
    return result.rows[0];
  }

  async create(userData: CreateUserData): Promise<User> {
    const { username, email, password_hash, first_name, last_name } = userData;
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const result = await client.query<User>(UserQueries.create, [
        username, 
        email, 
        password_hash, 
        first_name, 
        last_name,
        userData.address || null,
        userData.phone_number || null,
        userData.date_of_birth || null,
        userData.city || null,
        userData.country_code?.toUpperCase() || null,
        userData.ip_address || null
      ]);
      const user = result.rows[0];
      
      // Auto-create a wallet for the new user
      await client.query(WalletQueries.create, [user.id, 0.00, 'USD']);
      
      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    await db.query(UserQueries.updateLastLogin, [userId]);
  }
}

export default new UserRepository();
