import { db } from '../config/db';
import { DatabaseQueryResult } from '../types';
import SeedQueries from '../queries/seed.queries';

interface Category {
  id: number;
  name: string;
}

const categoryNames = [
  'Electronics',
  'Home Office',
  'Furniture',
  'Software',
  'Hardware',
  'Accessories',
  'Peripherals',
  'Networking',
  'Storage',
  'Audio',
  'Displays',
  'Power Supplies',
  'Cables',
  'Adapters',
  'Tools'
];

const seedCategories = async (database = db): Promise<DatabaseQueryResult<Category>> => {
  console.log('\ud83c\udf31 Seeding categories...');
  
  try {
    // Insert all categories
    const placeholders = categoryNames
      .map((_, i) => `($${i + 1})`)
      .join(',');
    
    const sql = SeedQueries.insertCategories(placeholders);
    
    const result = await database.query<Category>(sql, categoryNames);
    console.log(`✅ ${categoryNames.length} categories seeded`);
    return result;
  } catch (err) {
    console.error('❌ Category seeding failed:', err);
    throw err;
  }
};

export default seedCategories;
