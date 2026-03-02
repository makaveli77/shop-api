import { Request, Response, NextFunction } from 'express';
import OrderService from '../services/order.service';
import { CreateOrderInput } from '../types';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order and checkout management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Process order checkout
 *     description: Submits a new order, deducts items from inventory, and charges the user's wallet.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   properties:
 *                     article_id:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error, insufficient stock, or insufficient funds
 *       404:
 *         description: User's wallet or an article not found
 */
export const checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id; // Authenticated user ID
    const input: CreateOrderInput = req.body;
    
    const order = await OrderService.checkout(userId, input);
    
    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get user's orders
 *     description: Retrieves a paginated list of all orders placed by the authenticated user.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successful retrieval
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       total_amount:
 *                         type: string
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     count:
 *                       type: integer
 */
export const getUserOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const filters: {
      status?: string;
      custom_user_id?: number;
      created_at?: Date;
      updated_at?: Date;
      include_articles?: boolean;
    } = {};

    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.user_id) filters.custom_user_id = parseInt(req.query.user_id as string);
    if (req.query.created_at) filters.created_at = new Date(req.query.created_at as string);
    if (req.query.updated_at) filters.updated_at = new Date(req.query.updated_at as string);
    if (req.query.include_articles === 'true') filters.include_articles = true;

    const orders = await OrderService.getUserOrders(userId, page, limit, filters);
    
    res.status(200).json({
      data: orders,
      meta: {
        page,
        limit,
        count: orders.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get single order details
 *     description: Retrieves full details of a specific order including all purchased items.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Successful retrieval
 *       400:
 *         description: Invalid order ID
 *       404:
 *         description: Order not found
 */
export const getOrderDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const orderId = parseInt(req.params.id as string);
    
    if (isNaN(orderId)) {
      res.status(400).json({ message: 'Invalid order ID' });
      return;
    }

    const order = await OrderService.getOrderDetails(orderId, userId);
    
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};
