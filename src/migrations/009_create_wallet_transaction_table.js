/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create the 'wallet_transaction' table
  // This is the immutable ledger tracking money going in and out. Never update or delete rows here.
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS wallet_transaction (
      id SERIAL PRIMARY KEY,                                      
      wallet_id INTEGER NOT NULL REFERENCES wallet(id) ON DELETE CASCADE, 
      type VARCHAR(50) NOT NULL,                                  
      amount DECIMAL(12,2) NOT NULL,                              
      reference_id INTEGER,                                       
      description TEXT,                                           
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP              
    )
  `);

  // Performance Indexes
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_wallet_transaction_wallet_id ON wallet_transaction(wallet_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_wallet_transaction_type ON wallet_transaction(type)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_wallet_transaction_created_at ON wallet_transaction(created_at DESC)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_wallet_transaction_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_wallet_transaction_type');
  await knex.raw('DROP INDEX IF EXISTS idx_wallet_transaction_wallet_id');
  await knex.raw('DROP TABLE IF EXISTS wallet_transaction');
};
