
import { Request, Response, NextFunction } from 'express';
import ArticleService from '../services/article.service';

/**
 * @swagger
 * components:
 *   schemas:
 *     Article:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         price: { type: number }
 *         supplier_id: { type: integer }
 *         slug: { type: string }
 *         stock_quantity: { type: integer }
 *         image_url: { type: string }
 *         description: { type: string }
 *         tags: { type: array, items: { type: string } }
 *         discounted: { type: boolean }
 *         discounted_price: { type: number }
 *         expires_at: { type: string, format: date-time }
 *         categories: { type: array, items: { type: integer } }
 */

const ArticleController = {
  /**
   * @swagger
   * /articles:
   *   post:
   *     summary: Create a new article (Supports image upload)
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               name: { type: string }
   *               description: { type: string }
   *               tags: { type: array, items: { type: string } }
   *               price: { type: number }
   *               supplier_id: { type: integer }
   *               categories: { type: array, items: { type: integer } }
   *               image: { type: string, format: binary }
   *     responses:
   *       201:
   *         description: Article created
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Article' }
   *       400: { $ref: '#/components/schemas/ValidationError' }
   *       401: { $ref: '#/components/schemas/GenericError' }
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
      const article = await ArticleService.create(req.body, imageUrl);
      res.status(201).json(article);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/batch:
   *   post:
   *     summary: Create multiple articles at once
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items: { $ref: '#/components/schemas/Article' }
   *     responses:
   *       201:
   *         description: Articles created
   *       400: { $ref: '#/components/schemas/ValidationError' }
   */
  async createBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const articles = await ArticleService.createBatch(req.body);
      res.status(201).json(articles);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/discounts:
   *   post:
   *     summary: Create single or multiple article discounts
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             oneOf:
   *               - type: object
   *                 properties:
   *                   article_id: { type: integer }
   *                   discounted_price: { type: number }
   *                   expires_at: { type: string, format: date-time }
   *               - type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     article_id: { type: integer }
   *                     discounted_price: { type: number }
   *                     expires_at: { type: string, format: date-time }
   *     responses:
   *       201:
   *         description: Discounts created successfully
   *       400: { $ref: '#/components/schemas/ValidationError' }
   */
  async createDiscounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = Array.isArray(req.body) ? req.body : [req.body];
      await ArticleService.createDiscounts(payload);
      res.status(201).json({ message: 'Discounts created successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles:
   *   get:
   *     summary: List articles with filters, sorting, and pagination
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema: { type: integer, default: 1 }
   *       - in: query
   *         name: size
   *         schema: { type: integer, default: 10 }
   *       - in: query
   *         name: sort
   *         schema: { type: string, example: 'price' }
   *       - in: query
   *         name: order
   *         schema: { type: string, enum: [asc, desc], default: desc }
   *       - in: query
   *         name: name
   *         schema: { type: string }
   *       - in: query
   *         name: description
   *         schema: { type: string }
   *       - in: query
   *         name: tags
   *         style: form
   *         explode: true
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *       - in: query
   *         name: supplier_id
   *         schema: { type: integer }
   *       - in: query
   *         name: category_id
   *         schema: { type: integer }
   *       - in: query
   *         name: min_price
   *         schema: { type: number }
   *       - in: query
   *         name: max_price
   *         schema: { type: number }
   *     responses:
   *       200:
   *         description: Paginated list of articles with metadata
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 data:
   *                   type: array
   *                   items: { $ref: '#/components/schemas/Article' }
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total_count: { type: integer, example: 1000 }
   *                     total_pages: { type: integer, example: 100 }
   *                     current_page: { type: integer, example: 1 }
   *                     per_page: { type: integer, example: 10 }
   *                     has_next_page: { type: boolean }
   *                     has_prev_page: { type: boolean }
   */
  async index(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', size = '10', sort = 'created_at', order = 'desc', ...filters } = req.query;
      const limit = parseInt(size as string);
      const currentPage = parseInt(page as string);
      const offset = (currentPage - 1) * limit;
      const { rows, totalCount } = await ArticleService.getAll(
        limit,
        offset,
        filters as any,
        sort as string,
        order as string
      );
      const totalPages = Math.ceil(totalCount as number / limit);
      res.json({
        data: rows,
        meta: {
          total_count: totalCount,
          total_pages: totalPages,
          current_page: currentPage,
          per_page: limit,
          has_next_page: currentPage < totalPages,
          has_prev_page: currentPage > 1
        }
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/{id}:
   *   get:
   *     summary: Get an article by ID
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Article details
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Article' }
   *       404: { $ref: '#/components/schemas/GenericError' }
   */
  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const article = await ArticleService.getById(Number(req.params.id));
      res.json(article);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/{id}:
   *   put:
   *     summary: Update an article
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/Article' }
   *     responses:
   *       200:
   *         description: Article updated
   *       404: { $ref: '#/components/schemas/GenericError' }
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ArticleService.update(Number(req.params.id), req.body);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/{id}:
   *   delete:
   *     summary: Soft delete an article
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         description: Article deleted
   *       404: { $ref: '#/components/schemas/GenericError' }
   */
  async destroy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ArticleService.delete(Number(req.params.id));
      res.json({ message: 'Article deleted successfully (soft delete)', id: req.params.id });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /articles/stats:
   *   get:
   *     summary: Get article inventory statistics
   *     tags: [Articles]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: query
   *         name: supplier_id
   *         schema: { type: integer }
   *       - in: query
   *         name: city
   *         schema: { type: string }
   *     responses:
   *       200:
   *         description: Stats successfully retrieved
   */
  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { supplier_id, city } = req.query;
      const result = await ArticleService.getStats({ 
        supplier_id: supplier_id ? Number(supplier_id) : undefined, 
        city: city as string | undefined 
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};

export default ArticleController;
