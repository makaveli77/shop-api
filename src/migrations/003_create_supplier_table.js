// Create supplier table
exports.up = async function(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS supplier (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      company_name VARCHAR(255),
      city VARCHAR(100),
      latitude DECIMAL(9,6),
      longitude DECIMAL(9,6),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_supplier_city ON supplier(city)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_supplier_company_name ON supplier(company_name)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_supplier_coordinates ON supplier(latitude, longitude)');
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_supplier_created_at ON supplier(created_at DESC)');
};

exports.down = async function(knex) {
  await knex.raw('DROP INDEX IF EXISTS idx_supplier_created_at');
  await knex.raw('DROP INDEX IF EXISTS idx_supplier_coordinates');
  await knex.raw('DROP INDEX IF EXISTS idx_supplier_company_name');
  await knex.raw('DROP INDEX IF EXISTS idx_supplier_city');
  await knex.raw('DROP TABLE IF EXISTS supplier');
};
