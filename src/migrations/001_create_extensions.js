exports.up = async function(knex) {
  // Enable PostgreSQL extensions required for the application
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pg_trgm');
};

exports.down = async function(knex) {
  // Cannot drop extension in transaction if it's still in use
  // In production, handle this manually
  // await knex.raw('DROP EXTENSION IF NOT EXISTS pg_trgm CASCADE');
};
