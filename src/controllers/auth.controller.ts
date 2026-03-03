import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and token management
 */

const AuthController = {
  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Authenticate user and return JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 example: admin
   *               password:
   *                 type: string
   *                 format: password
   *                 example: password123
 *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   description: JWT Bearer token
   *       401:
   *         description: Invalid credentials
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   example: Invalid credentials
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /forgot-password:
   *   post:
   *     summary: Request a password reset email
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *     responses:
   *       200:
   *         description: Reset email sent (if user exists)
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) throw new Error('Email is required');
      
      await AuthService.forgotPassword(email);
      res.json({ message: 'If that email exists, a password reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * @swagger
   * /reset-password:
   *   post:
   *     summary: Reset password using token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [token, newPassword]
   *             properties:
   *               token:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 format: password
   *     responses:
   *       200:
   *         description: Password reset successful
   *       400:
   *         description: Invalid or expired token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) throw new Error('Token and newPassword are required');

      await AuthService.resetPassword(token, newPassword);
      res.json({ message: 'Password has been reset successfully.' });
    } catch (err) {
      next(err);
    }
  }
};

export default AuthController;
