/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create the 'wallet' table
  // This table acts as a snapshot of the user's current available funds.
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS wallet (
      id SERIAL PRIMARY KEY,                                      
      user_id INTEGER NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE, 
      balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,                
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',                 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,             
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP              
    )
  `);

  // Index on user_id to quickly find a user's wallet
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_wallet_user_id ON wallet(user_id)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_wallet_user_id');
  await knex.raw('DROP TABLE IF EXISTS wallet');
};
