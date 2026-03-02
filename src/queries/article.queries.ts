/**
 * Article SQL Queries
 * All raw SQL queries used by ArticleRepository
 */

interface FindAllQueries {
  count: (baseQuery: string) => string;
  data: (baseQuery: string, sortColumn: string, sortOrder: string) => string;
}

interface FilterConfig {
  allowedSortColumns: string[];
  textColumns: string[];
  exactColumns: string[];
}

interface ArticleQueriesType {
  findAll: FindAllQueries;
  save: string;
  saveBatch: (placeholders: string) => string;
  findById: string;
  update: string;
  softDelete: string;
  getStats: string;
  baseQuery: string;
  filterConfig: FilterConfig;
  deleteAll: string;
}

const ArticleQueries: ArticleQueriesType = {
  // Get filtered and paginated articles with count
  findAll: {
    count: (baseQuery: string) => `SELECT COUNT(DISTINCT a.id) as total ${baseQuery}`,
    data: (baseQuery: string, sortColumn: string, sortOrder: string) => `
      SELECT DISTINCT a.*, s.name as supplier_name, ad.discounted_price 
      ${baseQuery} 
      ORDER BY ${sortColumn} ${sortOrder} 
      LIMIT $LIMIT OFFSET $OFFSET`
  },

  // Create single article
  save: `
    INSERT INTO article (name, slug, supplier_id, serial_number, country_code, price, stock_quantity, description, tags, image_url, discounted, expires_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,

  // Create batch articles
  saveBatch: (placeholders: string) => `
    INSERT INTO article (name, slug, supplier_id, serial_number, country_code, price, stock_quantity, description, tags, image_url, discounted, expires_at) 
    VALUES ${placeholders} 
    RETURNING *`,

  // Find article by ID
  findById: `
    SELECT a.*, s.name as supplier_name, ad.discounted_price 
    FROM article a
    LEFT JOIN supplier s ON a.supplier_id = s.id
    LEFT JOIN article_discount ad ON a.id = ad.article_id AND (ad.expires_at IS NULL OR ad.expires_at > NOW())
    WHERE a.id = $1 AND a.deleted_at IS NULL`,

  // Update article
  update: `
    UPDATE article 
    SET name = $1, price = $2, stock_quantity = $3, description = $4, supplier_id = $5, discounted = $6, expires_at = $7, tags = $8
    WHERE id = $9 AND deleted_at IS NULL
    RETURNING *`,

  // Soft delete article
  softDelete: `UPDATE article SET deleted_at = NOW() WHERE id = $1 RETURNING *`,

  // Get article statistics
  getStats: `
    SELECT 
      COUNT(a.id) as total_articles,
      SUM(a.stock_quantity) as total_stock,
      SUM(a.price * a.stock_quantity) as total_inventory_value,
      AVG(a.price) as average_price,
      MIN(a.price) as cheapest_article,
      MAX(a.price) as most_expensive_article
    FROM article a
    LEFT JOIN supplier s ON a.supplier_id = s.id
    WHERE a.deleted_at IS NULL`,

  // Base query parts for findAll
  baseQuery: `FROM article a
             LEFT JOIN supplier s ON a.supplier_id = s.id
             LEFT JOIN article_category ac ON a.id = ac.article_id
             LEFT JOIN category c ON ac.category_id = c.id
             LEFT JOIN article_discount ad ON a.id = ad.article_id AND (ad.expires_at IS NULL OR ad.expires_at > NOW())
             WHERE a.deleted_at IS NULL`,

  // Configuration for findAll filtering
  filterConfig: {
    allowedSortColumns: ['name', 'price', 'stock_quantity', 'created_at', 'expires_at'],
    textColumns: ['name', 'slug', 'serial_number', 'description', 'country_code'],
    exactColumns: ['id', 'supplier_id', 'price', 'stock_quantity', 'discounted']
  },

  // Delete all articles (for seeding)
  deleteAll: `DELETE FROM article`
};

export default ArticleQueries;
