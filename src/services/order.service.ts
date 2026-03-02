import orderRepository from '../repositories/order.repository';
import { CreateOrderInput } from '../types';
import CacheService from './cache.service';

const OrderService = {
  async checkout(userId: number, input: CreateOrderInput) {
    // Basic deduplication: limit users to passing max ~50 items to prevent massive payloads
    if (input.items.length === 0) {
      const error: any = new Error('Order must contain at least one item');
      error.status = 400;
      throw error;
    }

    // Process the monolithic transaction
    const order = await orderRepository.createOrderTransaction(userId, input.items);

    // Invalidate caches because article stock quantity has fundamentally changed
    CacheService.invalidatePrefix('articles_'); 
    
    // Invalidate stats based on affected suppliers
    const affectedSuppliers: number[] = (order as any)._affectedSuppliers || [];
    affectedSuppliers.forEach(supplierId => {
      CacheService.invalidateStatsByFilters(supplierId);
    });
    
    // Always invalidate global stats
    CacheService.invalidateStatsByFilters();
    
    // Invalidate user orders cache
    CacheService.invalidatePrefix(`orders_user_${userId}_`);

    // Cleanup internal flag
    delete (order as any)._affectedSuppliers;

    return order;
  },

  async getUserOrders(
    userId: number,
    page: number = 1,
    limit: number = 10,
    filters?: {
      status?: string;
      custom_user_id?: number;
      created_at?: Date;
      updated_at?: Date;
      include_articles?: boolean;
    }
  ) {
    const offset = (page - 1) * limit;
    
    // Construct cache key based on all parameters
    const cacheKeyParts = [`orders_user_${userId}_page_${page}_limit_${limit}`];
    if (filters?.custom_user_id) cacheKeyParts.push(`custom_user_id_${filters.custom_user_id}`);
    if (filters?.status) cacheKeyParts.push(`status_${filters.status}`);
    if (filters?.created_at) cacheKeyParts.push(`created_at_${filters.created_at.toISOString().split('T')[0]}`);
    if (filters?.updated_at) cacheKeyParts.push(`updated_at_${filters.updated_at.toISOString().split('T')[0]}`);
    if (filters?.include_articles) cacheKeyParts.push(`include_articles_true`);
    const cacheKey = cacheKeyParts.join('_');
    
    const cachedOrders = CacheService.get(cacheKey);
    if (cachedOrders) {
      return cachedOrders;
    }

    const orders = await orderRepository.getUserOrders(userId, limit, offset, filters);
    
    // Fetch items for each order to include in the listing
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await orderRepository.getOrderItems(order.id);
        
        let orderWithItems: any = { ...order, items };
        if (filters?.include_articles) {
             const articleRepository = (await import('../repositories/article.repository')).default;
             orderWithItems.items = await Promise.all(
                 items.map(async (item) => {
                     const article = await articleRepository.findById(item.article_id);
                     return { ...item, article };
                 })
             );
        }
        return orderWithItems;
      })
    );

    CacheService.set(cacheKey, ordersWithItems);
    return ordersWithItems;
  },

  async getOrderDetails(orderId: number, userId: number) {
    const order = await orderRepository.getOrderByIdAndUser(orderId, userId);
    
    if (!order) {
      const error: any = new Error('Order not found');
      error.status = 404;
      throw error;
    }

    const items = await orderRepository.getOrderItems(orderId);
    return { ...order, items };
  }
};

export default OrderService;
