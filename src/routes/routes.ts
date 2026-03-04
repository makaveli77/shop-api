import express, { Request, Response, Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger';
import ArticleController from '../controllers/article.controller';
import AuthController from '../controllers/auth.controller';
import UserController from '../controllers/user.controller';
import CategoryController from '../controllers/category.controller';
import SupplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth';
import validate from '../middleware/validate';
import upload from '../middleware/upload';
import { singleArticleSchema, batchArticleSchema } from '../dtos/article.schema';
import { discountSchema } from '../dtos/article_discount.schema';
import { registerSchema, updateUserSchema } from '../dtos/user.schema';
import { CategorySchema } from '../dtos/category.schema';
import { supplierSchema, updateSupplierSchema } from '../dtos/supplier.schema';
import * as OrderController from '../controllers/order.controller';
import { createOrderSchema, getOrdersQuerySchema } from '../dtos/order.schema';
import DepositController from '../controllers/deposit.controller';

const router: Router = express.Router();

// --- PUBLIC ROUTES ---
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get('/test', (_req: Request, res: Response) => res.json({ status: 'success', message: 'API Online' }));
router.post('/login', AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/auth/verify', UserController.verify);
router.post('/register', validate(registerSchema), UserController.register);

// Stripe Webhook (MUST be public so Stripe can reach it, secured by signatures)
router.post('/webhooks/stripe', DepositController.webhook);

// --- PROTECTED ROUTES (JWT REQUIRED) ---
router.use(authenticate);

// User Management
router.get('/users/:id', UserController.show);
router.post('/users/:id/lock', UserController.lock);
router.get('/users/:id/stats', UserController.stats);
router.put('/users/:id', validate(updateUserSchema), UserController.update);

// Protected Category & Supplier Routes
router.get('/categories', CategoryController.index);
router.get('/categories/:id', CategoryController.show);
router.get('/suppliers', SupplierController.index);
router.get('/suppliers/:id', SupplierController.show);

// Specific/Static Product Routes
router.get('/articles/stats', ArticleController.stats);
router.post('/articles/batch', validate(batchArticleSchema), ArticleController.createBatch);

// Article Discounts Route
router.post('/articles/discounts', validate(discountSchema), ArticleController.createDiscounts);

// Resource Product Routes
router.get('/articles', ArticleController.index);
router.get('/articles/:id', ArticleController.show);

router.post(
	'/articles',
	upload.single('image'),
	validate(singleArticleSchema),
	ArticleController.create
);

router.put('/articles/:id', validate(singleArticleSchema), ArticleController.update);
router.delete('/articles/:id', ArticleController.destroy);

// Protected Category Routes
router.post('/categories', validate(CategorySchema), CategoryController.create);
router.put('/categories/:id', validate(CategorySchema), CategoryController.update);
router.delete('/categories/:id', CategoryController.destroy);

// Protected Supplier Routes
router.post('/suppliers', validate(supplierSchema), SupplierController.create);
router.put('/suppliers/:id', validate(updateSupplierSchema), SupplierController.update);
router.delete('/suppliers/:id', SupplierController.destroy);

// Protected Order/Checkout Routes
router.post('/orders', validate(createOrderSchema), OrderController.checkout);
router.get('/orders', validate(getOrdersQuerySchema, 'query'), OrderController.getUserOrders);
router.get('/orders/:id', OrderController.getOrderDetails);

// Protected Deposit Route
router.post('/deposits/initiate', DepositController.initiate);
router.post('/deposits/withdraw', DepositController.withdraw);

// Conditionally expose mock webhook ONLY in development
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  router.post('/deposits/mock-success/:deposit_request_id', DepositController.mockSuccess);
}

export default router;
