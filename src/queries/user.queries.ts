/**
 * User SQL Queries
 * All raw SQL queries used by UserRepository and UserService
 */

interface UserQueriesType {
  findByEmailOrUsername: string;
  findByEmail: string;
  findByUsername: string;
  findById: string;
  create: string;
  updateLastLogin: string;
  updatePassword: string;
  update: string;
  lock: string;
  getStats: string;
}

const UserQueries: UserQueriesType = {
  // Find user by email or username
  findByEmailOrUsername: `SELECT * FROM "user" WHERE email = $1 OR username = $2`,

  // Find user by email
  findByEmail: `SELECT * FROM "user" WHERE email = $1`,

  // Find user by username
  findByUsername: `SELECT * FROM "user" WHERE username = $1`,

  // Find user by id
  findById: `SELECT * FROM "user" WHERE id = $1`,

  // Create new user
  create: `
    INSERT INTO "user" (username, email, password_hash, first_name, last_name, address, phone_number, date_of_birth, city, country_code, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, username, email, first_name, last_name, address, phone_number, date_of_birth, city, country_code, ip_address, registration_date, last_login, is_locked`,

  // Update last login
  updateLastLogin: `UPDATE "user" SET last_login = NOW() WHERE id = $1`,

  // Update password
  updatePassword: `UPDATE "user" SET password_hash = $1 WHERE id = $2`,

  // Update user details
  update: `
    UPDATE "user"
    SET 
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        address = COALESCE($4, address),
        phone_number = COALESCE($5, phone_number),
        date_of_birth = COALESCE($6, date_of_birth),
        city = COALESCE($7, city),
        country_code = COALESCE($8, country_code)
    WHERE id = $1
    RETURNING id, username, email, first_name, last_name, address, phone_number, date_of_birth, city, country_code, ip_address, registration_date, last_login, is_locked
  `,

  // Lock user
  lock: `UPDATE "user" SET is_locked = TRUE WHERE id = $1 RETURNING id, username, is_locked`,

  // Get User Stats
  getStats: `
    SELECT 
      w.balance,
      w.currency,
      COALESCE(SUM(CASE WHEN wt.type = 'deposit' THEN wt.amount ELSE 0 END), 0) as total_deposited,
      COALESCE(ABS(SUM(CASE WHEN wt.type = 'withdrawal' THEN wt.amount ELSE 0 END)), 0) as total_withdrawn,
      COALESCE(ABS(SUM(CASE WHEN wt.type = 'purchase' THEN wt.amount ELSE 0 END)), 0) as total_spent,
      (
        SELECT json_agg(json_build_object(
          'id', t.id,
          'type', t.type,
          'amount', t.amount,
          'description', t.description,
          'reference_id', t.reference_id,
          'external_reference_id', CASE 
            WHEN t.type = 'deposit' THEN t.provider_tx_id 
            WHEN t.type = 'withdrawal' THEN t.wd_tx_id 
            ELSE NULL 
          END,
          'date', t.created_at
        ))
        FROM (
          SELECT wt.*, dr.provider_tx_id, wd.provider_tx_id as wd_tx_id
          FROM wallet_transaction wt
          LEFT JOIN deposit_request dr ON wt.reference_id = dr.id AND wt.type = 'deposit'
          LEFT JOIN withdrawal wd ON wt.reference_id = wd.id AND wt.type = 'withdrawal'
          WHERE wt.wallet_id = w.id 
          ORDER BY wt.created_at DESC 
          LIMIT 10
        ) t
      ) as recent_transactions
    FROM wallet w
    LEFT JOIN wallet_transaction wt ON w.id = wt.wallet_id
    WHERE w.user_id = $1
    GROUP BY w.id
  `
};

export default UserQueries;
