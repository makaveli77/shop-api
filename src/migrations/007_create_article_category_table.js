/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Many-to-many: article_category
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS article_category (
      article_id INTEGER REFERENCES article(id) ON DELETE CASCADE,
      category_id INTEGER REFERENCES category(id) ON DELETE CASCADE,
      PRIMARY KEY (article_id, category_id)
    )
  `);
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_category_article_id ON article_category(article_id)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_article_category_category_id ON article_category(category_id)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_article_category_category_id');
  await knex.raw('DROP INDEX IF EXISTS idx_article_category_article_id');
  await knex.raw('DROP TABLE IF EXISTS article_category');
};
