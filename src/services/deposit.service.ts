import Stripe from 'stripe';
import DepositRepository from '../repositories/deposit.repository';
import WalletQueries from '../queries/wallet.queries';
import { db } from '../config/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-02-24.acacia' as any,
});

const DepositService = {
  async initiateDeposit(userId: number, amount: number) {
    // Get User's Wallet ID
    const walletRes = await db.query(WalletQueries.findByUserId, [userId]);
    const wallet = walletRes.rows[0];
    
    if (!wallet) {
      throw new Error('Wallet not found for user');
    }

    // Create Pending Deposit Request in our database
    const depositRequest = await DepositRepository.createRequest(userId, wallet.id, amount, 'USD', 'stripe');

    // Contact Stripe to create a PaymentIntent
    // Stripe expects amount in cents for USD ($50.00 = 5000)
    const amountInCents = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        deposit_request_id: depositRequest.id.toString(),
        user_id: userId.toString(),
      },
    });

    // Update the DB with Stripe's uniquely generated transaction ID 
    await DepositRepository.updateProviderTxId(depositRequest.id, paymentIntent.id);

    // Return the client_secret to the frontend so they can securely complete the physical payment on their browser
    return {
      client_secret: paymentIntent.client_secret,
      deposit_request_id: depositRequest.id
    };
  },

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new Error('Amount must be greater than 0');

    // Get User's Wallet ID
    const walletRes = await db.query(WalletQueries.findByUserId, [userId]);
    const wallet = walletRes.rows[0];
    
    if (!wallet) throw new Error('Wallet not found for user');

    if (parseFloat(wallet.balance) < amount) {
      throw new Error('Insufficient funds to withdraw');
    }

    // Determine if we are in local dev running the mocked branch
    const isLocalMock = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('mock') || process.env.STRIPE_SECRET_KEY.includes('replace');

    let amountLeftToRefundCents = Math.round(amount * 100);
    const successfulRefunds: any[] = [];

    if (!isLocalMock) {
        // Real Stripe Logic
        const deposits = await DepositRepository.getCompletedDepositsByUser(userId);

        for (const dp of deposits) {
          if (amountLeftToRefundCents <= 0) break;

          try {
             // Retrieve the PI to check current unrefunded amount
             const pi = await stripe.paymentIntents.retrieve(dp.provider_tx_id, {
               expand: ['latest_charge']
             });

             const charge = pi.latest_charge as Stripe.Charge | null;
             if (!charge) continue;

             const availableToRefundCents = charge.amount - charge.amount_refunded;
             if (availableToRefundCents <= 0) continue;

             const refundAmount = Math.min(amountLeftToRefundCents, availableToRefundCents);

             const refund = await stripe.refunds.create({
                payment_intent: dp.provider_tx_id,
                amount: refundAmount
             });

             successfulRefunds.push({ provider_tx_id: dp.provider_tx_id, amountDecducted: refundAmount / 100, refund_id: refund.id });
             amountLeftToRefundCents -= refundAmount;
          } catch (err: any) {
             console.error(`Refund failed for ${dp.provider_tx_id}:`, err.message);
          }
        }

        if (amountLeftToRefundCents === Math.round(amount * 100)) {
           throw new Error('Withdrawal could not be processed. No eligible refundable deposits found.');
        }
    } else {
        // MOCK LOGIC for Local Dev
        successfulRefunds.push({ provider_tx_id: 'mock_tx_id', amountDecducted: amount, refund_id: 're_mock_' + Date.now() });
        amountLeftToRefundCents = 0; // Successfully mocked all
    }

    const totalWithdrawnCents = Math.round(amount * 100) - amountLeftToRefundCents;
    const totalWithdrawnAmount = totalWithdrawnCents / 100;

    // Deduct from DB securely using the repository
    await DepositRepository.processWithdrawal(userId, wallet.id, totalWithdrawnAmount, successfulRefunds);

    return {
      success: true,
      requested_amount: amount,
      withdrawn_amount: totalWithdrawnAmount,
      status: amountLeftToRefundCents === 0 ? 'completed' : 'partial',
      refunds: successfulRefunds
    };
  },

  async handleStripeWebhook(payload: string | Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

    let event;

    try {
      // Cryptographically verify the request really came from Stripe using our webhook secret
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed.`, err.message);
      throw new Error('Webhook error');
    }

    // Handle different types of events from Stripe
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSuccess = event.data.object as Stripe.PaymentIntent;
        
        // Grab the internal ID we saved earlier
        const depositRequestIdStr = paymentIntentSuccess.metadata.deposit_request_id;
        if (depositRequestIdStr) {
           const depositRequestId = parseInt(depositRequestIdStr, 10);
           // Run our safe DB lock transaction
           await DepositRepository.completeDeposit(depositRequestId);
           console.log(`✅  Deposit completed successfully for Request ID ${depositRequestId}`);
        }
        break;

      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object as Stripe.PaymentIntent;
        const failedRequestIdStr = paymentIntentFailed.metadata.deposit_request_id;
        
        if (failedRequestIdStr) {
           const failedRequestId = parseInt(failedRequestIdStr, 10);
           await DepositRepository.failDeposit(failedRequestId);
           console.log(`❌  Deposit failed for Request ID ${failedRequestId}`);
        }
        break;

      default:
        // Ignore event types we don't care about
        console.log(`Unhandled event type ${event.type}`);
    }

    return true;
  }
};

export default DepositService;