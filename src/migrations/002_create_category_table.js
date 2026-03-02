// Create category table
exports.up = async function(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS category (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP
    )
  `);
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_category_name ON category(name)');
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_category_name');
  await knex.raw('DROP TABLE IF EXISTS category');
};
