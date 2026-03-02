/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Create order_item table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS order_item (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      article_id INTEGER NOT NULL REFERENCES article(id) ON DELETE RESTRICT,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price DECIMAL(12,2) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_order_item_order_id ON order_item(order_id)`);
  await knex.raw(`CREATE INDEX IF NOT EXISTS idx_order_item_article_id ON order_item(article_id)`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_order_item_article_id');
  await knex.raw('DROP INDEX IF EXISTS idx_order_item_order_id');
  await knex.raw('DROP TABLE IF EXISTS order_item');
};
