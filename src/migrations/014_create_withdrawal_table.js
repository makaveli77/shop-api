/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS withdrawal (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      wallet_id INTEGER NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
      amount DECIMAL(12,2) NOT NULL,
      provider_tx_id VARCHAR(255), -- The main refund ID (if single) or primary reference
      details JSONB,               -- Full breakdown of refunds [ { refund_id, amount }, ... ]
      status VARCHAR(50) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Index for lookups
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_withdrawal_user ON withdrawal(user_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_withdrawal_provider_tx ON withdrawal(provider_tx_id)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`DROP TABLE IF EXISTS withdrawal`);
};
