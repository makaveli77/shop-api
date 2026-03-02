/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create orders table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      total_amount DECIMAL(12,2) NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'USD',
      status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'cancelled'
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_orders_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_status');
  await knex.raw('DROP INDEX IF EXISTS idx_orders_user_id');
  await knex.raw('DROP TABLE IF EXISTS orders');
};
