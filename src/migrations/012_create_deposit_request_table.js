/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS deposit_request (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      wallet_id INTEGER NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
      currency VARCHAR(10) NOT NULL DEFAULT 'USD',
      provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
      provider_tx_id VARCHAR(255) UNIQUE, 
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_deposit_request_user_id ON deposit_request(user_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_deposit_request_provider_tx_id ON deposit_request(provider_tx_id)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_deposit_request_provider_tx_id');
  await knex.raw('DROP INDEX IF EXISTS idx_deposit_request_user_id');
  await knex.raw('DROP TABLE IF EXISTS deposit_request');
};
