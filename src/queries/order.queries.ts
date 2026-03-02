/**
 * Order SQL Queries
 * All raw SQL queries used for creating and retrieving orders
 */

interface OrderQueriesType {
  createOrder: string;
  createOrderItem: string;
  getUserOrders: string;
  getOrderById: string;
  getOrderItemsByOrderId: string;
  getWalletForUpdate: string;
  getArticleForUpdate: string;
  deductWalletBalance: string;
  deductArticleStock: string;
}

const OrderQueries: OrderQueriesType = {
  // Create a new order
  createOrder: `
    INSERT INTO orders (user_id, total_amount, currency, status) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *`,

  // Create an order item mapping
  createOrderItem: `
    INSERT INTO order_item (order_id, article_id, quantity, unit_price, subtotal) 
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,

  // Fetch all orders for a specific user
  getUserOrders: `
    SELECT id, total_amount, currency, status, created_at, updated_at 
    FROM orders 
    WHERE user_id = $1 
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,

  // Get single order detail by user
  getOrderById: `
    SELECT * FROM orders 
    WHERE id = $1 AND user_id = $2`,
    
  // Get order items for a specific order
  getOrderItemsByOrderId: `
    SELECT oi.*, a.name as article_name 
    FROM order_item oi
    JOIN article a ON oi.article_id = a.id
    WHERE oi.order_id = $1`,

  // Get Wallet FOR UPDATE to lock row during transaction
  getWalletForUpdate: `
    SELECT * FROM wallet WHERE user_id = $1 FOR UPDATE`,

  // Get Article FOR UPDATE, including potential discount logic, to lock row
  getArticleForUpdate: `
    SELECT 
      a.id, a.price, a.stock_quantity, a.name, a.supplier_id,
      ad.discounted_price, ad.expires_at
    FROM article a
    LEFT JOIN article_discount ad 
      ON a.id = ad.article_id 
      AND (ad.expires_at IS NULL OR ad.expires_at > NOW())
    WHERE a.id = $1 AND a.deleted_at IS NULL 
    FOR UPDATE OF a`,

  // Deduct Wallet Balance
  deductWalletBalance: `
    UPDATE wallet 
    SET balance = balance - $1, updated_at = NOW() 
    WHERE id = $2`,

  // Deduct Article Stock
  deductArticleStock: `
    UPDATE article 
    SET stock_quantity = stock_quantity - $1 
    WHERE id = $2`
};

export default OrderQueries;
