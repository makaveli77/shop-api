export const SeedQueries = {
  deleteAllOrderItems: `DELETE FROM order_item;`,
  deleteAllOrders: `DELETE FROM orders;`,
  deleteAllDepositRequests: `DELETE FROM deposit_request;`,
  deleteAllWalletTransactions: `DELETE FROM wallet_transaction;`,

  getAllWallets: `SELECT id, user_id FROM wallet;`,
  fundWallet: `UPDATE wallet SET balance = balance + $1 WHERE id = $2;`,
  deductWallet: `UPDATE wallet SET balance = balance - $1 WHERE id = $2;`,
  
  insertWalletTransactionWithoutRef: `
    INSERT INTO wallet_transaction (wallet_id, type, amount, description) 
    VALUES ($1, $2, $3, $4);
  `,
  
  insertWalletTransactionWithRef: `
    INSERT INTO wallet_transaction (wallet_id, type, amount, reference_id, description) 
    VALUES ($1, $2, $3, $4, $5);
  `,

  insertDepositRequest: `
    INSERT INTO deposit_request (user_id, wallet_id, amount, provider_tx_id, status) 
    VALUES ($1, $2, $3, $4, $5) RETURNING id;
  `,

  getAllArticlesIdsAndPrices: `SELECT id, price FROM article;`,

  insertOrder: `
    INSERT INTO orders (user_id, total_amount, status) 
    VALUES ($1, $2, $3) RETURNING id;
  `,

  insertOrderItem: `
    INSERT INTO order_item (order_id, article_id, quantity, unit_price, subtotal) 
    VALUES ($1, $2, $3, $4, $5);
  `,

  deductArticleStock: `
    UPDATE article 
    SET stock_quantity = GREATEST(stock_quantity - $1, 0) 
    WHERE id = $2;
  `,

  insertArticleCategories: (placeholders: string) => `
    INSERT INTO article_category (article_id, category_id) 
    VALUES ${placeholders} 
    ON CONFLICT DO NOTHING
  `,

  insertArticleDiscounts: (placeholders: string) => `
    INSERT INTO article_discount (article_id, supplier_id, category_id, discounted_price, expires_at) 
    VALUES ${placeholders} 
    ON CONFLICT DO NOTHING
  `,

  insertSuppliers: (placeholders: string) => `
    INSERT INTO supplier (name, company_name, city, latitude, longitude)
    VALUES ${placeholders}
    ON CONFLICT DO NOTHING
    RETURNING *
  `,

  insertCategories: (placeholders: string) => `
    INSERT INTO category (name) 
    VALUES ${placeholders}
    ON CONFLICT (name) DO NOTHING
    RETURNING *
  `
};

export default SeedQueries;
