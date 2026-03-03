import { Request, Response, NextFunction } from 'express';
import DepositService from '../services/deposit.service';
import DepositRepository from '../repositories/deposit.repository';

/**
 * @swagger
 * tags:
 *   name: Deposits
 *   description: Add funds to user wallet via Payment Gateway
 */

const DepositController = {
  /**
   * @swagger
   * /deposits/initiate:
   *   post:
   *     summary: Create a Stripe PaymentIntent to start a deposit
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [amount]
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 1
   *                 example: 50
   *                 description: The amount heavily in USD to deposit 
   *     responses:
   *       200:
   *         description: Returns client_secret for Stripe Checkout
   */
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      const result = await DepositService.initiateDeposit(userId, amount);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * @swagger
   * /deposits/withdraw:
   *   post:
   *     summary: Withdraw deposited funds back to the original payment method
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [amount]
   *             properties:
   *               amount:
   *                 type: number
   *                 minimum: 1
   *                 example: 20
   *                 description: The amount heavily in USD to withdraw 
   *     responses:
   *       200:
   *         description: Returns status of the withdrawal
   */
  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { amount } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Amount must be greater than 0' });
        return;
      }

      const result = await DepositService.withdraw(userId, amount);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Stripe Webhook:
   * Do NOT attach swagger because it is server-to-server communication from Stripe.
   * Do NOT use standard JSON body parsers, Stripe requires raw body to verify signature.
   */
  async webhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const signature = req.headers['stripe-signature'] as string;
    
    // Express needs raw body here. We configure this in app.ts or routes.
    // For now, lets assume req.body is the raw buffer.
    try {
      await DepositService.handleStripeWebhook(req.body, signature);
      // ALWAYS should return a standard 200 OK immediately back to Stripe so they don't retry
      res.status(200).send({ received: true });
    } catch (error) {
      console.error('Webhook processing failed:', error);
      res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  },

  /**
   * @swagger
   * /deposits/mock-success/{deposit_request_id}:
   *   post:
   *     summary: (LOCAL DEV ONLY) Simulate a successful Stripe webhook via DB lock
   *     description: Bypass Stripe's cryptographic checks and immediately process a pending deposit (update balance and emit ledger transaction).
   *     tags: [Deposits]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: deposit_request_id
   *         required: true
   *         schema:
   *           type: integer
   *         description: The ID of the initated deposit request
   *     responses:
   *       200:
   *         description: Wallet balance successfully updated
   */
  async mockSuccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const depositRequestId = parseInt(req.params.deposit_request_id as string, 10);
      
      if (!depositRequestId) {
        res.status(400).json({ error: 'Valid deposit_request_id is required' });
        return;
      }

      // Call the same safe Row-Lock DB function the Webhook would use!
      // This is safe because completeDeposit() enforces it ONLY runs once if status is 'pending'
      const updatedRequest = await DepositRepository.completeDeposit(depositRequestId);

      if (!updatedRequest) {
        res.status(400).json({ error: 'Deposit request not found or is no longer pending.' });
        return;
      }

      res.status(200).json({
        message: 'Mock webhook successful! Your wallet balance has been increased.',
        request: updatedRequest
      });
    } catch (error) {
      next(error);
    }
  }
};

export default DepositController;