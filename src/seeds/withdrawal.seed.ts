import { faker } from '@faker-js/faker';
import SeedQueries from '../queries/seed.queries';

const seedWithdrawals = async (db: any): Promise<void> => {
  console.log('🌱 Seeding Withdrawals...');

  const walletsRes = await db.query(SeedQueries.getAllWallets);
  const wallets = walletsRes.rows as any[];

  if (wallets.length === 0) {
    console.log('⚠️ No wallets found. Skipping withdrawals seed.');
    return;
  }

  // Generate Withdrawals/Payouts (50 total, under $50 each)
  for (let i = 0; i < 50; i++) {
    const wallet = faker.helpers.arrayElement(wallets);
    const amount = faker.number.float({ min: 1, max: 50, fractionDigits: 2 });
    
    // Deduct from wallet
    await db.query(SeedQueries.deductWallet, [amount, wallet.id]);
    
    // Record withdrawal transaction
    await db.query(SeedQueries.insertWalletTransactionWithoutRef, [wallet.id, 'withdrawal', -amount, 'Refund/Withdrawal (Seeded)']);
  }
  console.log('✅ 50 withdrawals seeded');
};

export default seedWithdrawals;
