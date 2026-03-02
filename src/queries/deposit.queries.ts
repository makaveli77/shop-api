export const DepositQueries = {
  create: `
    INSERT INTO deposit_request (user_id, wallet_id, amount, currency, provider, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    RETURNING *;
  `,
  
  updateProviderTxId: `
    UPDATE deposit_request
    SET provider_tx_id = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `,
  
  findByProviderTxId: `
    SELECT * FROM deposit_request WHERE provider_tx_id = $1;
  `,

  updateStatus: `
    UPDATE deposit_request
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `,

  getDepositRequestForUpdate: `
    SELECT * FROM deposit_request WHERE id = $1 FOR UPDATE;
  `,

  getWalletForUpdate: `
    SELECT * FROM wallet WHERE id = $1 FOR UPDATE;
  `,

  markDepositCompleted: `
    UPDATE deposit_request SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1;
  `,

  updateWalletBalance: `
    UPDATE wallet SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;
  `,

  insertWalletTransaction: `
    INSERT INTO wallet_transaction (wallet_id, type, amount, reference_id, description) 
    VALUES ($1, 'deposit', $2, $3, $4);
  `,

  getCompletedUserDeposits: `
    SELECT * FROM deposit_request 
    WHERE user_id = $1 AND status = 'completed' AND provider = 'stripe' AND provider_tx_id IS NOT NULL 
    ORDER BY created_at DESC;
  `,

  insertWithdrawalTransaction: `
    INSERT INTO wallet_transaction (wallet_id, type, amount, reference_id, description) 
    VALUES ($1, 'withdrawal', $2, $3, $4);
  `,

  createWithdrawal: `
    INSERT INTO withdrawal (user_id, wallet_id, amount, provider_tx_id, details)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `
};

export default DepositQueries;
