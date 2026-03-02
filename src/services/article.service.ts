import ArticleRepository from '../repositories/article.repository';
import CategoryRepository from '../repositories/category.repository';
import ArticleDTO from '../dtos/article.dto';
import CacheService from './cache.service';
import { CreateArticleInput, UpdateArticleInput, ArticleFilters, StatsFilters, Article, DatabaseQueryResult, CreateArticleDiscountPayload } from '../types';

interface CustomError extends Error {
  status?: number;
}

const CACHE_PREFIX = 'articles_';
const CACHE_TTL = 300; // 5 minutes

const ArticleService = {
  async create(articleData: CreateArticleInput, imageUrl: string | null = null): Promise<Article> {
    const dto = new ArticleDTO(articleData);
    if (imageUrl) {
      dto.image_url = imageUrl;
    }
    const article = await ArticleRepository.save(dto);
    if (articleData.categories && articleData.categories.length) {
      await CategoryRepository.addCategories(article.id, articleData.categories);
      article.categories = articleData.categories;
    }
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return article;
  },

  async createBatch(articlesData: CreateArticleInput[]): Promise<Article[]> {
    const dtos = articlesData.map(item => new ArticleDTO(item));
    const articles = await ArticleRepository.saveBatch(dtos);
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return articles;
  },

  async createDiscounts(discounts: CreateArticleDiscountPayload[]): Promise<void> {
    await ArticleRepository.saveDiscounts(discounts);
    CacheService.invalidatePrefix(CACHE_PREFIX);
  },

  async getById(id: number): Promise<Article> {
    const article = await ArticleRepository.findByIdWithCategories(id);
    if (!article) {
      const error: CustomError = new Error('Article not found');
      error.status = 404;
      throw error;
    }
    return article;
  },

  async getAll(
    limit: number,
    offset: number,
    filters: ArticleFilters,
    sort: string,
    order: string
  ): Promise<DatabaseQueryResult<Article>> {
    const filtersString = JSON.stringify(filters, Object.keys(filters).sort());
    const cacheKey = `${CACHE_PREFIX}${limit}_${offset}_${sort}_${order}_${filtersString}`;

    const cachedData = CacheService.get<DatabaseQueryResult<Article>>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const data = await ArticleRepository.findAll(limit, offset, filters, sort, order);
    CacheService.set(cacheKey, data, CACHE_TTL);
    return data;
  },

  async update(id: number, articleData: UpdateArticleInput): Promise<Article> {
    const dto = new ArticleDTO(articleData as CreateArticleInput);
    const updatedArticle = await ArticleRepository.update(id, dto);
    if (!updatedArticle) {
      const error: CustomError = new Error('Article not found');
      error.status = 404;
      throw error;
    }
    // Remove old categories and add new ones
    await CategoryRepository.removeCategories(id);
    if (articleData.categories && articleData.categories.length) {
      await CategoryRepository.addCategories(id, articleData.categories);
      updatedArticle.categories = articleData.categories;
    }
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return updatedArticle;
  },

  async delete(id: number): Promise<Article> {
    const article = await ArticleRepository.softDelete(id);
    if (!article) {
      const error: CustomError = new Error('Article not found or already deleted');
      error.status = 404;
      throw error;
    }
    CacheService.invalidatePrefix(CACHE_PREFIX);
    return article;
  },

  async getStats(filters: StatsFilters) {
    const cacheKey = `stats_${filters.supplier_id || 'all'}_${filters.city || 'all'}`;

    // Try to get from cache
    const cachedStats = CacheService.get(cacheKey);
    if (cachedStats) {
      return { source: 'cache', ...cachedStats };
    }

    // If not in cache, hit the DB
    const stats = await ArticleRepository.getStats(filters);

    const responseData = {
      filters,
      data: {
        total_articles: parseInt(stats.total_articles || '0'),
        total_stock: parseInt(stats.total_stock || '0'),
        total_inventory_value: parseFloat(stats.total_inventory_value || '0').toFixed(2),
        average_price: parseFloat(stats.average_price || '0').toFixed(2),
        extremes: {
          min: parseFloat(stats.cheapest_article || '0').toFixed(2),
          max: parseFloat(stats.most_expensive_article || '0').toFixed(2)
        }
      }
    };

    // Save to cache for 5 minutes
    CacheService.set(cacheKey, responseData, 300);

    return { source: 'database', ...responseData };
  }
};

export default ArticleService;
