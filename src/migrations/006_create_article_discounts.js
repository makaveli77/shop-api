/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add columns to article table
  await knex.raw(`
    ALTER TABLE article 
    ADD COLUMN discounted BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN expires_at TIMESTAMP NULL;
  `);

  // 2. Create article_discount table
  await knex.raw(`
    CREATE TABLE article_discount (
      id SERIAL PRIMARY KEY,
      article_id INTEGER NOT NULL REFERENCES article(id) ON DELETE CASCADE,
      supplier_id INTEGER NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
      discounted_price DECIMAL(10, 2) NOT NULL,
      expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  // 3. Indexes for performance
  await knex.raw(`CREATE INDEX idx_article_discount_article_id ON article_discount(article_id);`);
  await knex.raw(`CREATE INDEX idx_article_discount_supplier_id ON article_discount(supplier_id);`);
  await knex.raw(`CREATE INDEX idx_article_discount_category_id ON article_discount(category_id);`);
  await knex.raw(`CREATE INDEX idx_article_discount_expires_at ON article_discount(expires_at);`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(`DROP TABLE IF EXISTS article_discount CASCADE;`);
  
  await knex.raw(`
    ALTER TABLE article 
    DROP COLUMN IF EXISTS discounted,
    DROP COLUMN IF EXISTS expires_at;
  `);
};
