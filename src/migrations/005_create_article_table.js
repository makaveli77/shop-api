// Create article table
exports.up = async function(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS article (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES supplier(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      serial_number VARCHAR(100) UNIQUE,
      country_code VARCHAR(2),
      price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
      stock_quantity INTEGER DEFAULT 0,
      description TEXT,
      tags VARCHAR(100)[] DEFAULT '{}',
      image_url VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      deleted_at TIMESTAMP DEFAULT NULL
    )
  `);
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_name_trgm ON article USING gin (name gin_trgm_ops)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_active_id ON article(id) WHERE deleted_at IS NULL');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_price ON article(price)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_created_at ON article(created_at DESC)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_supplier_id ON article(supplier_id)');
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_article_supplier_id');
  await knex.raw('DROP INDEX IF EXISTS idx_article_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_article_price');
  await knex.raw('DROP INDEX IF EXISTS idx_article_active_id');
  await knex.raw('DROP INDEX IF EXISTS idx_article_name_trgm');
  await knex.raw('DROP TABLE IF EXISTS article');
};
