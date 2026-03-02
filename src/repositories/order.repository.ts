import { db } from '../config/db';
import OrderQueries from '../queries/order.queries';
import WalletQueries from '../queries/wallet.queries';
import { Order, OrderItem, OrderItemInput } from '../types';

interface ProcessedOrderItem {
  article_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  supplier_id: number;
}

interface CustomError extends Error {
  status?: number;
}

class OrderRepository {
  async createOrderTransaction(userId: number, items: OrderItemInput[]): Promise<Order> {
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Get Wallet and lock it
      const walletRes = await client.query(OrderQueries.getWalletForUpdate, [userId]);
      if (walletRes.rows.length === 0) {
        throw this.createError('Wallet not found for user', 404);
      }
      const wallet = walletRes.rows[0];

      let totalAmount = 0;
      const processedItems: ProcessedOrderItem[] = [];
      const affectedSuppliers = new Set<number>();

      // 2. Process each item: lock article, check stock, calculate subtotal
      for (const item of items) {
        const articleRes = await client.query(OrderQueries.getArticleForUpdate, [item.article_id]);
        
        if (articleRes.rows.length === 0) {
          throw this.createError(`Article with ID \${item.article_id} not found or inactive`, 404);
        }
        
        const article = articleRes.rows[0];

        if (article.stock_quantity < item.quantity) {
          throw this.createError(`Insufficient stock for \${article.name}. Available: \${article.stock_quantity}`, 400);
        }

        // Determine correct price
        const unitPrice = article.discounted_price ? Number(article.discounted_price) : Number(article.price);
        const subtotal = unitPrice * item.quantity;
        
        totalAmount += subtotal;

        processedItems.push({
          article_id: article.id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal: subtotal,
          supplier_id: article.supplier_id
        });

        affectedSuppliers.add(article.supplier_id);
      }

      // 3. Check Wallet Balance
      if (Number(wallet.balance) < totalAmount) {
        throw this.createError(`Insufficient wallet balance. Total: \${totalAmount}, Balance: \${wallet.balance}`, 400);
      }

      // 4. Create the Order
      const orderRes = await client.query<Order>(OrderQueries.createOrder, [userId, totalAmount, 'USD', 'completed']);
      const newOrder = orderRes.rows[0];

      // 5. Deduct Wallet Balance & Create Transaction
      await client.query(OrderQueries.deductWalletBalance, [totalAmount, wallet.id]);
      
      await client.query(WalletQueries.createTransaction, [
        wallet.id,
        'purchase',
        -totalAmount,  // Negative for deduction
        newOrder.id,   // Reference ID
        `Order #\${newOrder.id}` // Description
      ]);

      // 6. Insert Order Items & Deduct Stock
      for (const pItem of processedItems) {
        // Insert Item
        await client.query(OrderQueries.createOrderItem, [
          newOrder.id,
          pItem.article_id,
          pItem.quantity,
          pItem.unit_price,
          pItem.subtotal
        ]);

        // Deduct Stock
        await client.query(OrderQueries.deductArticleStock, [pItem.quantity, pItem.article_id]);
      }

      await client.query('COMMIT');

      // Attach affected suppliers so the service can invalidate cache
      (newOrder as any)._affectedSuppliers = Array.from(affectedSuppliers);

      return newOrder;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserOrders(
    userId: number,
    limit: number,
    offset: number,
    filters?: {
      status?: string;
      custom_user_id?: number;
      created_at?: Date;
      updated_at?: Date;
    }
  ): Promise<Order[]> {
    let query = `
      SELECT id, user_id, total_amount, currency, status, created_at, updated_at 
      FROM orders 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.custom_user_id) {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(filters.custom_user_id);
    } else {
        query += ` AND user_id = $${paramIndex++}`;
        params.push(userId);
    }

    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters?.created_at) {
      query += ` AND DATE(created_at) = DATE($${paramIndex++})`;
      params.push(filters.created_at);
    }

    if (filters?.updated_at) {
      query += ` AND DATE(updated_at) = DATE($${paramIndex++})`;
      params.push(filters.updated_at);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await db.query<Order>(query, params);
    return result.rows;
  }

  async getOrderByIdAndUser(orderId: number, userId: number): Promise<Order | undefined> {
    const result = await db.query<Order>(OrderQueries.getOrderById, [orderId, userId]);
    return result.rows[0];
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const result = await db.query<OrderItem>(OrderQueries.getOrderItemsByOrderId, [orderId]);
    return result.rows;
  }

  private createError(message: string, status: number): CustomError {
    const error: CustomError = new Error(message);
    error.status = status;
    return error;
  }
}

export default new OrderRepository();
