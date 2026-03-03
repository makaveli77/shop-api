import { faker } from '@faker-js/faker';
import SeedQueries from '../queries/seed.queries';

const seedOrdersAndDeposits = async (db: any): Promise<void> => {
  console.log('🌱 Seeding Deposits and Orders...');

  // Get all users and wallets
  const walletsRes = await db.query(SeedQueries.getAllWallets);
  const wallets = walletsRes.rows as any[];

  if (wallets.length === 0) {
    console.log('⚠️ No wallets found. Skipping deposits/orders seed.');
    return;
  }

  // Pre-fund all users safely with $1,000,000 so they have plenty of room to make large random purchases in the script
  // without dropping below 0, mimicking long-term wealthy returning clients.
  for (const wallet of wallets) {
    await db.query(SeedQueries.fundWallet, [1000000, wallet.id]);
    await db.query(SeedQueries.insertWalletTransactionWithoutRef, [wallet.id, 'deposit', 1000000, 'Seeding Top-up for Order Tests']);
  }

  // Generate Deposits (100 total: mix of completed, pending, failed)
  const depositStatuses = [
    ...Array(50).fill('completed'),
    ...Array(25).fill('pending'),
    ...Array(25).fill('failed')
  ];

  for (let i = 0; i < 100; i++) {
    const wallet = faker.helpers.arrayElement(wallets);
    const amount = faker.number.float({ min: 10, max: 2000, fractionDigits: 2 });
    const status = depositStatuses[i];
    const providerTxId = `pi_${faker.string.alphanumeric(24)}`;

    const reqRes = await db.query(SeedQueries.insertDepositRequest, [wallet.user_id, wallet.id, amount, providerTxId, status]);

    if (status === 'completed') {
      const depositId = reqRes.rows[0].id;
      // Follow the real logic flow: successful deposits increase wallet and leave a ledger trail
      await db.query(SeedQueries.fundWallet, [amount, wallet.id]);
      await db.query(SeedQueries.insertWalletTransactionWithRef, [wallet.id, 'deposit', amount, depositId, 'Stripe Deposit (Seeded)']);
    }
  }
  console.log('✅ 100 deposits seeded');

  // Get all articles to pick from
  const articlesRes = await db.query(SeedQueries.getAllArticlesIdsAndPrices);
  const articles = articlesRes.rows as any[];

  if (articles.length === 0) {
    console.log('⚠️ No articles found. Skipping order seed.');
    return;
  }

  // Generate Orders (700 completed, 300 failed, 200 pending = 1200 total)
  const orderConfigs = [
    ...Array(700).fill('completed'),
    ...Array(300).fill('failed'),
    ...Array(200).fill('pending')
  ];
  
  // Shuffle array to simulate random timeline flow
  const shuffledConfigs = faker.helpers.shuffle(orderConfigs);
  
  for (const status of shuffledConfigs) {
    const wallet = faker.helpers.arrayElement(wallets);
    
    // Pick 1 to 5 random items for the cart
    const numItems = faker.number.int({ min: 1, max: 5 });
    const cartItems = faker.helpers.arrayElements(articles, numItems);
    
    let totalAmount = 0;
    const orderItems = cartItems.map(a => {
      const qty = faker.number.int({ min: 1, max: 4 });
      const subtotal = Number(a.price) * qty;
      totalAmount += subtotal;
      return { article_id: a.id, quantity: qty, unit_price: Number(a.price), subtotal };
    });
    
    // Create the Order parent
    const orderRes = await db.query(SeedQueries.insertOrder, [wallet.user_id, totalAmount, status]);
    
    const orderId = orderRes.rows[0].id;
    
    // Create the Order Items
    for (const item of orderItems) {
      await db.query(SeedQueries.insertOrderItem, [orderId, item.article_id, item.quantity, item.unit_price, item.subtotal]);
    }
    
    // Follow the real repository logic flow:
    if (status === 'completed') {
      // Deduct wallet
      await db.query(SeedQueries.deductWallet, [totalAmount, wallet.id]);
      
      // Add purchase trail to immutable ledger
      await db.query(SeedQueries.insertWalletTransactionWithRef, [wallet.id, 'purchase', -totalAmount, orderId, `Order #${orderId} (Seeded)`]);
      
      // Deduct stock from articles to mimic physical inventory moving
      for (const item of orderItems) {
        await db.query(SeedQueries.deductArticleStock, [item.quantity, item.article_id]);
      }
    }
  }

  console.log(`✅ 1200 orders seeded (700 completed, 300 failed, 200 pending)`);
};

export default seedOrdersAndDeposits;
