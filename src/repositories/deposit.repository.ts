import { db } from '../config/db';
import DepositQueries from '../queries/deposit.queries';

const DepositRepository = {
  async createRequest(userId: number, walletId: number, amount: number, currency: string = 'USD', provider: string = 'stripe') {
    const res = await db.query(DepositQueries.create, [userId, walletId, amount, currency, provider]);
    return res.rows[0];
  },

  async updateProviderTxId(id: number, providerTxId: string) {
    const res = await db.query(DepositQueries.updateProviderTxId, [providerTxId, id]);
    return res.rows[0];
  },

  async findByProviderTxId(providerTxId: string) {
    const res = await db.query(DepositQueries.findByProviderTxId, [providerTxId]);
    return res.rows[0];
  },

  // This operation is highly critical: updates status ONLY if pending, adds funds to wallet, creates ledger record.
  async completeDeposit(depositRequestId: number) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Lock the deposit request
      const reqRes = await client.query(DepositQueries.getDepositRequestForUpdate, [depositRequestId]);
      const depositRequest = reqRes.rows[0];

      if (!depositRequest || depositRequest.status !== 'pending') {
         await client.query('ROLLBACK');
         return null; // Doesn't exist or already processed
      }

      // Lock the wallet
      const walletRes = await client.query(DepositQueries.getWalletForUpdate, [depositRequest.wallet_id]);
      const wallet = walletRes.rows[0];

      if (!wallet) {
         await client.query('ROLLBACK');
         throw new Error('Wallet not found');
      }

      // Mark deposit as completed
      await client.query(DepositQueries.markDepositCompleted, [depositRequestId]);

      // Update the wallet balance
      const newBalance = parseFloat(wallet.balance) + parseFloat(depositRequest.amount);
      await client.query(DepositQueries.updateWalletBalance, [newBalance, wallet.id]);

      // Insert into wallet_transaction ledger
      await client.query(DepositQueries.insertWalletTransaction, [wallet.id, depositRequest.amount, depositRequest.id, 'Stripe Deposit']);

      await client.query('COMMIT');
      return depositRequest;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async failDeposit(depositRequestId: number) {
    const res = await db.query(DepositQueries.updateStatus, ['failed', depositRequestId]);
    return res.rows[0];
  },

  async getCompletedDepositsByUser(userId: number) {
    const res = await db.query(DepositQueries.getCompletedUserDeposits, [userId]);
    return res.rows;
  },

  async processWithdrawal(userId: number, walletId: number, amount: number, refunds: any[]) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(DepositQueries.getWalletForUpdate, [walletId]);
      const wallet = walletRes.rows[0];

      if (!wallet) {
         await client.query('ROLLBACK');
         throw new Error('Wallet not found');
      }

      if (parseFloat(wallet.balance) < amount) {
         await client.query('ROLLBACK');
         throw new Error('Insufficient funds to withdraw');
      }

      const newBalance = parseFloat(wallet.balance) - amount;
      await client.query(DepositQueries.updateWalletBalance, [newBalance, wallet.id]);
      
      // Determine primary provider_tx_id
      const primaryTxId = refunds.length > 0 ? refunds[0].refund_id : null;
      
      // Create Withdrawal Record
      const wRes = await client.query(DepositQueries.createWithdrawal, [
        userId, 
        walletId, 
        amount, 
        primaryTxId, 
        JSON.stringify(refunds)
      ]);
      const withdrawalId = wRes.rows[0].id;
      
      // Negative amount for withdrawal ledger, referencing the withdrawal record
      await client.query(DepositQueries.insertWithdrawalTransaction, [wallet.id, -amount, withdrawalId, 'Refund/Withdrawal']);
      
      await client.query('COMMIT');
      return { oldBalance: wallet.balance, newBalance };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default DepositRepository;
