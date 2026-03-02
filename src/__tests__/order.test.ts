import request from 'supertest';
import app from '../app';
import OrderRepository from '../repositories/order.repository';
import CacheService from '../services/cache.service';
import jwt from 'jsonwebtoken';

jest.mock('../repositories/order.repository');

const mockedOrderRepository = OrderRepository as jest.Mocked<typeof OrderRepository>;

jest.mock('../repositories/article.repository', () => {
  return {
    __esModule: true,
    default: { findById: jest.fn().mockResolvedValue({ id: 1, name: 'Test Article' }) }
  };
});

jest.mock('../repositories/article.repository', () => {
  return {
    __esModule: true,
    default: { findById: jest.fn().mockResolvedValue({ id: 1, name: 'Test Article' }) }
  };
});

describe('Order API Integration Tests', () => {
  let token: string;
  const SECRET = process.env.JWT_SECRET || 'secret';
  const mockUserId = 1;

  beforeAll(() => {
    token = jwt.sign({ id: mockUserId, username: 'admin' }, SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /orders', () => {
    it('should return 400 if validation fails (empty items)', async () => {
      const res = await request(app)
        .post('/orders')
        .set('Authorization', "Bearer " + token)
        .send({ items: [] });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 if validation fails (invalid quantity)', async () => {
      const res = await request(app)
        .post('/orders')
        .set('Authorization', "Bearer " + token)
        .send({ items: [{ article_id: 1, quantity: 0 }] });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors[0]).toContain('"items[0].quantity" must be a positive number');
    });

    it('should return 201 and create an order', async () => {
      const mockOrder = {
        id: 10,
        user_id: mockUserId,
        total_amount: 150.00,
        currency: 'USD',
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
        _affectedSuppliers: [1, 2]
      };

      mockedOrderRepository.createOrderTransaction.mockResolvedValueOnce(mockOrder as any);

      const spyInvalidatePrefix = jest.spyOn(CacheService, 'invalidatePrefix').mockImplementation(() => {});
      const spyInvalidateStats = jest.spyOn(CacheService, 'invalidateStatsByFilters').mockImplementation(() => {});

      const res = await request(app)
        .post('/orders')
        .set('Authorization', "Bearer " + token)
        .send({
          items: [
            { article_id: 1, quantity: 1 },
            { article_id: 2, quantity: 2 }
          ]
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'Order created successfully');
      expect(res.body.order.id).toBe(10);
      expect(mockedOrderRepository.createOrderTransaction).toHaveBeenCalledWith(mockUserId, [
        { article_id: 1, quantity: 1 },
        { article_id: 2, quantity: 2 }
      ]);
      expect(spyInvalidatePrefix).toHaveBeenCalledWith('articles_');
      expect(spyInvalidateStats).toHaveBeenCalledTimes(3); 
    });
  });

  describe('GET /orders', () => {
    it('should return 200 and paginated orders', async () => {
      const mockOrders = [
        { id: 1, user_id: mockUserId, total_amount: 100, currency: 'USD', status: 'completed', created_at: new Date(), updated_at: new Date() },
        { id: 2, user_id: mockUserId, total_amount: 200, currency: 'USD', status: 'completed', created_at: new Date(), updated_at: new Date() }
      ];

      mockedOrderRepository.getUserOrders.mockResolvedValueOnce(mockOrders as any);
      mockedOrderRepository.getOrderItems.mockResolvedValue([]);

      const res = await request(app)
        .get('/orders?page=1&limit=10')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(10);
      expect(res.body.meta.count).toBe(2);
      expect(mockedOrderRepository.getUserOrders).toHaveBeenCalledWith(mockUserId, 10, 0, {});
    });

    it('should return 200 and filter orders by status and date', async () => {
      const mockOrders = [
        { id: 1, user_id: mockUserId, total_amount: 100, currency: 'USD', status: 'completed', created_at: new Date(), updated_at: new Date() }
      ];

      mockedOrderRepository.getUserOrders.mockResolvedValueOnce(mockOrders as any);
      mockedOrderRepository.getOrderItems.mockResolvedValue([]);

      const res = await request(app)
        .get('/orders?status=completed&created_at=2023-01-01')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(mockedOrderRepository.getUserOrders).toHaveBeenCalledWith(
        mockUserId, 
        10, 
        0, 
        expect.objectContaining({ 
          status: 'completed',
          created_at: new Date('2023-01-01T00:00:00.000Z')
        })
      );
    });

    it('should return 200 and include articles when include_articles is true', async () => {
      const mockOrders = [
        { id: 1, user_id: mockUserId, total_amount: 100, currency: 'USD', status: 'completed', created_at: new Date(), updated_at: new Date() }
      ];
      const mockItems = [
        { id: 100, order_id: 1, article_id: 1, quantity: 2, unit_price: 50, subtotal: 100 }
      ];

      mockedOrderRepository.getUserOrders.mockResolvedValueOnce(mockOrders as any);
      mockedOrderRepository.getOrderItems.mockResolvedValueOnce(mockItems as any);

      const res = await request(app)
        .get('/orders?include_articles=true')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(200);
      expect(mockedOrderRepository.getUserOrders).toHaveBeenCalledWith(
        mockUserId, 
        10, 
        0, 
        expect.objectContaining({ 
          include_articles: true 
        })
      );
    });
  });

  describe('GET /orders/:id', () => {
    it('should return 400 if order ID is invalid', async () => {
      const res = await request(app)
        .get('/orders/invalid-id')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Invalid order ID');
    });

    it('should return 404 if order is not found or belongs to someone else', async () => {
      mockedOrderRepository.getOrderByIdAndUser.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .get('/orders/999')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(404);
    });

    it('should return 200 and the order details with items', async () => {
      const mockOrder = { id: 1, user_id: mockUserId, total_amount: 100, currency: 'USD', status: 'completed' };
      const mockItems = [
        { id: 1, order_id: 1, article_id: 10, quantity: 2, unit_price: 50, subtotal: 100 }
      ];

      mockedOrderRepository.getOrderByIdAndUser.mockResolvedValueOnce(mockOrder as any);
      mockedOrderRepository.getOrderItems.mockResolvedValueOnce(mockItems as any);

      const res = await request(app)
        .get('/orders/1')
        .set('Authorization', "Bearer " + token);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.items.length).toBe(1);
      expect(res.body.items[0].subtotal).toBe(100);
    });
  });
});
