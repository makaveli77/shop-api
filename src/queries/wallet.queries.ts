/**
 * Wallet SQL Queries
 * All raw SQL queries used for wallet and wallet_transaction
 */

interface WalletQueriesType {
  create: string;
  findByUserId: string;
  createTransaction: string;
}

const WalletQueries: WalletQueriesType = {
  // Create a new wallet for a user
  create: `
    INSERT INTO wallet (user_id, balance, currency) 
    VALUES ($1, $2, $3) 
    RETURNING id, user_id, balance, currency`,

  // Find a wallet using the user_id
  findByUserId: `SELECT id, user_id, balance, currency FROM wallet WHERE user_id = $1`,

  // Create a new transaction in the ledger
  createTransaction: `
    INSERT INTO wallet_transaction (wallet_id, type, amount, reference_id, description) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id`
};

export default WalletQueries;
