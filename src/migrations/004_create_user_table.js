exports.up = async function(knex) {
  // Create user table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS "user" (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      address VARCHAR(255),
      phone_number VARCHAR(50),
      date_of_birth DATE,
      city VARCHAR(100),
      country_code VARCHAR(2),
      ip_address VARCHAR(45),
      registration_date TIMESTAMP DEFAULT NOW(),
      last_login TIMESTAMP DEFAULT NULL,
      is_locked BOOLEAN DEFAULT FALSE,
      is_verified BOOLEAN DEFAULT FALSE
    )
  `);
  
  // Seed admin user for testing
  // Username: admin, Password: password123
  await knex.raw(`
    INSERT INTO "user" (username, email, password_hash, first_name, last_name, registration_date, last_login, is_verified)
      VALUES ('admin', 'admin@example.com', '$2b$10$jISxvCdJkUsLwxKuzax8MOfLRH/gUJlZl9yPVzllJ8oP9zwaRY2/u', 'Admin', 'User', NOW(), NULL, TRUE) ON CONFLICT DO NOTHING;
  `);
  
  // User indexes for performance
  // Index for sorting/filtering by creation date (username, email already indexed via UNIQUE)
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_user_registration_date ON "user"(registration_date DESC)');
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_user_registration_date');
  await knex.raw('DROP TABLE IF EXISTS "user"');
};
