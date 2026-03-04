import { Request, Response, NextFunction } from 'express';
import UserService from '../services/user.service';

const UserController = {
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - email
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 example: johndoe
   *               email:
   *                 type: string
   *                 example: johndoe@example.com
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User registered successfully
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       409:
   *         description: Username or Email already exists
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Username or Email already exists
   *       400:
   *         description: Validation error
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: error
   *                 errors:
   *                   type: array
   *                   items:
   *                     type: string
   *                   example: ["username is required"]
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payload = { ...req.body, ip_address: req.ip };
      const user = await UserService.register(payload);
      res.status(201).json({
        message: "User registered successfully. Please check your email to verify your account.",
        user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /auth/verify:
   *   get:
   *     summary: Verify user email address
   *     tags: [Auth]
   *     parameters:
   *       - in: query
   *         name: token
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email verified successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       400:
   *         description: Invalid or expired token
   */
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.query;
      if (!token) {
        res.status(400).json({ message: 'Verification token is required' });
        return;
      }
      
      const result = await UserService.verifyEmail(token as string);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user details
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         content: 
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       404: { description: User not found }
   */
  async show(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.getUser(parseInt(req.params.id as string));
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user details
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     requestBody:
   *       content:
   *         application/json:
   *           schema: { $ref: '#/components/schemas/UserUpdate' }
   *     responses:
   *       200:
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       404: { description: User not found }
   */ 
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.updateUser(parseInt(req.params.id as string), req.body);
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /users/{id}/lock:
   *   post:
   *     summary: Lock user account
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/User' }
   *       404: { description: User not found }
   */
  async lock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await UserService.lockUser(parseInt(req.params.id as string));
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /users/{id}/stats:
   *   get:
   *     summary: Get user statistics and balance
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: integer }
   *     responses:
   *       200:
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/UserStats' }
   *       404: { description: User not found }
   */
  async stats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await UserService.getStats(parseInt(req.params.id as string));
      res.json(stats);
    } catch (error) {
       next(error);
    }
  }
};

export default UserController;
