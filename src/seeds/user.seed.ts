import { faker } from '@faker-js/faker';
import UserQueries from '../queries/user.queries';
import WalletQueries from '../queries/wallet.queries';

const seedUsers = async (db: any, count: number = 10): Promise<void> => {
  console.log('🌱 Seeding users and wallets...');
  let seededCount = 0;
  
  // Use the same hash as the admin for "password123"
  const passwordHash = '$2b$10$jISxvCdJkUsLwxKuzax8MOfLRH/gUJlZl9yPVzllJ8oP9zwaRY2/u';
  
  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName().replace(/'/g, "''");
    const lastName = faker.person.lastName().replace(/'/g, "''");
    const username = faker.internet.userName({ firstName, lastName }).toLowerCase() + Math.random().toString().substring(2, 6);
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();
    
    // Generate new fake fields
    const address = faker.location.streetAddress();
    const phone_number = faker.phone.number();
    const date_of_birth = faker.date.birthdate().toISOString().split('T')[0];
    const city = faker.location.city();
    const country_code = faker.location.countryCode('alpha-2');
    const ip_address = faker.internet.ipv4();

    try {
      // Create User
      const userResult = await db.query(UserQueries.create, [
        username, email, passwordHash, firstName, lastName,
        address, phone_number, date_of_birth, city, country_code, ip_address
      ]);
      
      const userId = userResult.rows[0].id;
      
      // Create Wallet with random balance ($50.00 to $1000.00)
      const initialBalance = faker.finance.amount({ min: 50, max: 1000, dec: 2 });
      await db.query(WalletQueries.create, [userId, initialBalance, 'USD']);
      
      const walletIdResult = await db.query(WalletQueries.findByUserId, [userId]);
      const walletId = walletIdResult.rows[0].id;
      
      // Create initial wallet transaction for the deposit
      await db.query(WalletQueries.createTransaction, [walletId, 'deposit', initialBalance, 'Initial promotional deposit']);
      
      seededCount++;
    } catch (err) {
      console.error(`Error specifically seeding user ${username}:`, err);
    }
  }
  
  // Also make sure the 'admin' user created by migrations has a wallet
  try {
    const adminUser = await db.query(UserQueries.findByUsername, ['admin']);
    if (adminUser.rows.length > 0) {
      const adminId = adminUser.rows[0].id;
      const adminWalletExist = await db.query(WalletQueries.findByUserId, [adminId]);
      
      // If admin doesn't have a wallet, give admin $9999.99
      if (adminWalletExist.rows.length === 0) {
        await db.query(WalletQueries.create, [adminId, 9999.99, 'USD']);
        const newWalletCheck = await db.query(WalletQueries.findByUserId, [adminId]);
        await db.query(WalletQueries.createTransaction, [newWalletCheck.rows[0].id, 'deposit', 9999.99, 'Admin God Mode Funds']);
      }
    }
  } catch (err) {
    console.error('Failed processing admin wallet:', err);
  }
  
  console.log(`✅ ${seededCount} users seeded with wallets`);
};

export default seedUsers;