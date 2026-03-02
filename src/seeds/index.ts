import 'dotenv/config';
import { db } from '../config/db';
import seedArticles from './article.seed';
import seedCategories from './category.seed';
import seedSuppliers from './supplier.seed';
import seedUsers from './user.seed';
import seedOrdersAndDeposits from './order_deposit.seed';
import seedWithdrawals from './withdrawal.seed';
import ArticleQueries from '../queries/article.queries';
import SeedQueries from '../queries/seed.queries';

const runSeeder = async (): Promise<void> => {
  console.log('🌱 Initializing Database Seeds...');
  try {
    // Clear dependent tables first to handle constraints
    await db.query(SeedQueries.deleteAllOrderItems);
    await db.query(SeedQueries.deleteAllOrders);
    await db.query(SeedQueries.deleteAllDepositRequests);
    await db.query(SeedQueries.deleteAllWalletTransactions);

    // Clear articles first (depends on category and supplier)
    await db.query<any>(ArticleQueries.deleteAll);
    
    // Seed users + wallets (10 users + admin)
    await seedUsers(db, 10);
    
    // Seed categories (15 categories)
    await seedCategories(db);
    
    // Seed suppliers (50 suppliers)
    await seedSuppliers(db);
    
    // Seed articles (1000 articles)
    await seedArticles(db, 1000);

    // Seed Orders and Deposits (1200 orders, 100 deposits)
    await seedOrdersAndDeposits(db);

    // Seed Withdrawals/Payouts (50 withdrawals)
    await seedWithdrawals(db);
    
    console.log('✅ All seeds completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

runSeeder();
