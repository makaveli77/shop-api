import { db } from '../config/db';
import CacheService from '../services/cache.service';
import { Article, ArticleFilters, ArticleStats, DatabaseQueryResult, StatsFilters, CreateArticleDiscountPayload } from '../types';
import ArticleDTO from '../dtos/article.dto';


import CategoryRepository from './category.repository';

const ArticleRepository = {
  async findByIdWithCategories(id: number): Promise<Article | undefined> {
    const { rows } = await db.query<Article>('SELECT * FROM article WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (!rows.length) return undefined;
    const article = rows[0];
    article.categories = await CategoryRepository.getCategories(id);
    return article;
  },

  async findAll(
    limit: number = 10,
    offset: number = 0,
    filters: ArticleFilters = {},
    sort: string = 'created_at',
    order: string = 'DESC'
  ): Promise<DatabaseQueryResult<Article>> {
    const { allowedSortColumns, textColumns, exactColumns } = require('../queries/article.queries').default.filterConfig;
    const sortColumn = allowedSortColumns.includes(sort) ? `a.${sort}` : 'a.created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    let baseQuery = require('../queries/article.queries').default.baseQuery;
    const values: any[] = [];
    const filterClauses: string[] = [];
    Object.keys(filters).forEach((key) => {
      const value = (filters as any)[key];
      if (value === undefined || value === null || value === '') return;
      
      // Special handling for expires_at to fetch articles expiring before or on the given date
      if (key === 'expires_at') {
        values.push(value);
        filterClauses.push(`a.expires_at <= $${values.length}`);
        return;
      }
      
      // Special handling for tags to check array overlap
      if (key === 'tags') {
        const tagsArr = Array.isArray(value) ? value : [value];
        values.push(tagsArr);
        filterClauses.push(`a.tags && $${values.length}`);
        return;
      }

      if (textColumns.includes(key)) {
        values.push(`%${value}%`);
        filterClauses.push(`a.${key} ILIKE $${values.length}`);
      } else if (exactColumns.includes(key)) {
        values.push(value);
        filterClauses.push(`a.${key} = $${values.length}`);
      }
    });
    if (filterClauses.length > 0) {
      baseQuery += ` AND ${filterClauses.join(' AND ')}`;
    }
    const countQuery = require('../queries/article.queries').default.findAll.count(baseQuery);
    const countRes = await db.query<{ total: string }>(countQuery, values);
    const totalCount = parseInt(countRes.rows[0]?.total || '0');
    values.push(limit, offset);
    const dataQuery = require('../queries/article.queries').default.findAll.data(baseQuery, sortColumn, sortOrder)
      .replace('$LIMIT', `$${values.length - 1}`)
      .replace('$OFFSET', `$${values.length}`);
    const { rows } = await db.query<Article>(dataQuery, values);
    return {
      rows,
      totalCount
    };
  },

  async save(dto: ArticleDTO): Promise<Article> {
    // Invalidate stats for this article's supplier
    CacheService.invalidateStatsByFilters(dto.supplier_id);
    const values = [dto.name, dto.slug, dto.supplier_id, dto.serial_number, dto.country_code, dto.price, dto.stock_quantity, dto.description, dto.tags || [], dto.image_url, dto.discounted || false, dto.expires_at || null];
    const { rows } = await db.query<Article>(require('../queries/article.queries').default.save, values);
    return rows[0];
  },

  async saveBatch(dtos: ArticleDTO[]): Promise<Article[]> {
    // Invalidate stats for all affected suppliers
    const uniqueSuppliers = [...new Set(dtos.map(d => d.supplier_id))];
    uniqueSuppliers.forEach(supplier_id => CacheService.invalidateStatsByFilters(supplier_id));
    const values: any[] = [];
    const placeholders = dtos.map((d, i) => {
      const offset = i * 12;
      values.push(d.name, d.slug, d.supplier_id, d.serial_number, d.country_code, d.price, d.stock_quantity, d.description, d.tags || [], d.image_url, d.discounted || false, d.expires_at || null);
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
    }).join(',');
    const sql = require('../queries/article.queries').default.saveBatch(placeholders);
    const { rows } = await db.query<Article>(sql, values);
    return rows;
  },

  async saveDiscounts(payloads: CreateArticleDiscountPayload[]): Promise<void> {
    if (!payloads.length) return;

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const articleIds = payloads.map(p => p.article_id);
      const { rows: articles } = await client.query(`
        SELECT a.id, a.supplier_id, 
               (SELECT category_id FROM article_category ac WHERE ac.article_id = a.id LIMIT 1) as category_id
        FROM article a
        WHERE a.id = ANY($1) AND a.deleted_at IS NULL
      `, [articleIds]);

      const articleMap = new Map(articles.map(a => [a.id, a]));

      const discountValues: any[] = [];
      const discountPlaceholders: string[] = [];
      
      let discountIndex = 1;
      
      for (const payload of payloads) {
        const article = articleMap.get(payload.article_id);
        if (!article) continue;
        
        CacheService.invalidateStatsByFilters(article.supplier_id);
         
        const categoryId = article.category_id || 1;
        
        discountValues.push(
          payload.article_id,
          article.supplier_id,
          categoryId,
          payload.discounted_price,
          payload.expires_at || null
        );
        
        const offset = (discountIndex - 1) * 5;
        discountPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        discountIndex++;
      }

      if (discountPlaceholders.length > 0) {
        const insertSql = `
          INSERT INTO article_discount (article_id, supplier_id, category_id, discounted_price, expires_at)
          VALUES ${discountPlaceholders.join(',')}
        `;
        await client.query(insertSql, discountValues);

        for (const payload of payloads) {
           if (articleMap.has(payload.article_id)) {
              await client.query(
                'UPDATE article SET discounted = TRUE, expires_at = $1 WHERE id = $2',
                [payload.expires_at || null, payload.article_id]
              );
           }
        }
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  async findById(id: number): Promise<Article | undefined> {
    const { rows } = await db.query<Article>(require('../queries/article.queries').default.findById, [id]);
    return rows[0];
  },

  async update(id: number, dto: ArticleDTO): Promise<Article | undefined> {
    // Invalidate stats for this article's supplier
    CacheService.invalidateStatsByFilters(dto.supplier_id);
    const values = [dto.name, dto.price, dto.stock_quantity, dto.description, dto.supplier_id, dto.discounted || false, dto.expires_at || null, dto.tags || [], id];
    const { rows } = await db.query<Article>(require('../queries/article.queries').default.update, values);
    return rows[0];
  },

  async softDelete(id: number): Promise<Article | undefined> {
    // Get article to know which supplier's cache to invalidate
    const article = await this.findById(id);
    if (article) {
      CacheService.invalidateStatsByFilters(article.supplier_id);
    }
    const { rows } = await db.query<Article>(require('../queries/article.queries').default.softDelete, [id]);
    return rows[0];
  },

  async getStats(filters: StatsFilters = {}): Promise<ArticleStats> {
    let query = require('../queries/article.queries').default.getStats;
    const values: any[] = [];
    if (filters.supplier_id) {
      values.push(filters.supplier_id);
      query += ` AND a.supplier_id = $1`;
    } else if (filters.city) {
      values.push(filters.city);
      query += ` AND s.city ILIKE $1`;
    }
    const { rows } = await db.query<ArticleStats>(query, values);
    return rows[0];
  }
};

export default ArticleRepository;
