import request from 'supertest';
import app from '../app';
import ArticleRepository from '../repositories/article.repository';
import CategoryRepository from '../repositories/category.repository';
import CacheService from '../services/cache.service';
import jwt from 'jsonwebtoken';

jest.mock('../repositories/article.repository');
jest.mock('../repositories/category.repository');

const mockedArticleRepository = ArticleRepository as jest.Mocked<typeof ArticleRepository>;
const mockedCategoryRepository = CategoryRepository as jest.Mocked<typeof CategoryRepository>;

describe('Article API Integration Tests', () => {
  let token: string;
  const SECRET = process.env.JWT_SECRET || 'secret';

  beforeAll(() => {
    token = jwt.sign({ id: 1, username: 'admin' }, SECRET);
  });

  afterEach(() => {
    jest.clearAllMocks();
    CacheService.clear();
  });

  describe('GET /articles', () => {
    it('should return a paginated list with metadata', async () => {
      const mockData = [{ id: 1, name: 'MacBook', price: 2000 }];
      
      mockedArticleRepository.findAll.mockResolvedValue({ 
        rows: mockData as any, 
        totalCount: 1 
      });

      const res = await request(app)
        .get('/articles?page=1&size=5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toEqual(mockData);
      
      expect(res.body.meta.current_page).toBe(1);
      expect(res.body.meta.total_count).toBe(1);
      expect(res.body.meta.total_pages).toBe(1);
      expect(res.body.meta.has_next_page).toBe(false);
    });
  });

  describe('POST /articles', () => {
    it('should return 400 if price is negative', async () => {
      const res = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Phone', price: -100, supplier_id: 1, categories: [1] });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toContain('"price" must be greater than or equal to 0');
    });

    it('should return 201 if data is valid', async () => {
      const mockArticle = { id: 1, name: 'Phone', price: 500, supplier_id: 1, categories: [1] };
      mockedArticleRepository.save.mockResolvedValue(mockArticle as any);
      mockedCategoryRepository.addCategories.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Phone', price: 500, supplier_id: 1, categories: [1] });

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockArticle);
    });
  });

  describe('GET /articles/:id', () => {
    it('should return 404 if article is not found', async () => {
      mockedArticleRepository.findByIdWithCategories.mockResolvedValue(undefined);

      const res = await request(app)
        .get('/articles/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Article not found');
    });

    it('should return 200 and the article if found', async () => {
      const mockArticle = { id: 1, name: 'Phone', price: 500, supplier_id: 1 };
      mockedArticleRepository.findByIdWithCategories.mockResolvedValue(mockArticle as any);

      const res = await request(app)
        .get('/articles/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockArticle);
    });
  });

  describe('PUT /articles/:id', () => {
    it('should return 404 if article to update is not found', async () => {
      mockedArticleRepository.update.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/articles/999')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Phone', price: 600, supplier_id: 1 });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Article not found');
    });

    it('should return 200 and updated article if successful', async () => {
      const mockArticle = { id: 1, name: 'Updated Phone', price: 600, supplier_id: 1, categories: [2] };
      mockedArticleRepository.update.mockResolvedValue(mockArticle as any);
      mockedCategoryRepository.removeCategories.mockResolvedValue(undefined);
      mockedCategoryRepository.addCategories.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/articles/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Phone', price: 600, supplier_id: 1, categories: [2] });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockArticle);
    });
  });

  describe('DELETE /articles/:id', () => {
    it('should return 404 if article to delete is not found', async () => {
      mockedArticleRepository.softDelete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete('/articles/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Article not found or already deleted');
    });

    it('should return 200 if article is successfully deleted', async () => {
      const mockArticle = { id: 1, name: 'Phone', price: 500, supplier_id: 1 };
      mockedArticleRepository.softDelete.mockResolvedValue(mockArticle as any);

      const res = await request(app)
        .delete('/articles/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Article deleted successfully (soft delete)');
    });
  });

  describe('GET /articles/stats', () => {
    it('should return 200 and stats data', async () => {
      const mockStats = {
        total_articles: '10',
        total_stock: '50',
        total_inventory_value: '5000.00',
        average_price: '500.00',
        cheapest_article: '100.00',
        most_expensive_article: '1000.00'
      };
      mockedArticleRepository.getStats.mockResolvedValue(mockStats as any);

      const res = await request(app)
        .get('/articles/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.total_articles).toBe(10);
      expect(res.body.data.total_inventory_value).toBe('5000.00');
    });
  });

  describe('POST /articles/batch', () => {
    it('should return 201 and created articles', async () => {
      const mockArticles = [
        { id: 1, name: 'Phone 1', price: 500, supplier_id: 1 },
        { id: 2, name: 'Phone 2', price: 600, supplier_id: 1 }
      ];
      mockedArticleRepository.saveBatch.mockResolvedValue(mockArticles as any);

      const res = await request(app)
        .post('/articles/batch')
        .set('Authorization', `Bearer ${token}`)
        .send([
          { name: 'Phone 1', price: 500, supplier_id: 1 },
          { name: 'Phone 2', price: 600, supplier_id: 1 }
        ]);

      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockArticles);
    });
  });
});
