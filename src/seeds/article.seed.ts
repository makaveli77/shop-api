import { faker } from '@faker-js/faker';
import ArticleQueries from '../queries/article.queries';
import SeedQueries from '../queries/seed.queries';
import { db } from '../config/db';
import { DatabaseQueryResult } from '../types';

interface Article {
  name: string;
  slug: string;
  supplier_id: number;
  serial_number: string;
  country_code: string;
  price: string;
  stock_quantity: number;
  description: string;
  categories?: number[];
  discounted?: boolean;
  expires_at?: Date | null;
}

const seedArticles = async (database = db, count: number = 1000): Promise<DatabaseQueryResult<Article>> => {
  console.log(`\ud83c\udf31 Seeding ${count} articles...`);
  
  try {
    const articles: Article[] = [];
    for (let i = 0; i < count; i++) {
      const name = faker.commerce.productName();
      const isDiscounted = Math.random() > 0.8; // 20% chance of being discounted
      articles.push({
        supplier_id: faker.number.int({ min: 1, max: 50 }), // Random supplier from 1-50
        name,
        slug: faker.helpers.slugify(name).toLowerCase() + '-' + faker.string.nanoid(5),
        serial_number: faker.string.alphanumeric(10).toUpperCase(),
        country_code: faker.location.countryCode('alpha-2'),
        price: faker.commerce.price({ min: 10, max: 2000 }),
        stock_quantity: faker.number.int({ min: 0, max: 500 }),
        description: faker.commerce.productDescription(),
        categories: [faker.number.int({ min: 1, max: 15 })],
        discounted: isDiscounted,
        expires_at: isDiscounted ? faker.date.future() : null
      });
    }

    const values: (string | number | boolean | null | Date | string[])[] = [];
    const placeholders = articles
      .map((a, i) => {
        const offset = i * 12;
        values.push(a.name, a.slug, a.supplier_id, a.serial_number, a.country_code, a.price, a.stock_quantity, a.description, [], null, a.discounted || false, a.expires_at || null);
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12})`;
      })
      .join(',');

    const sql = ArticleQueries.saveBatch(placeholders);
    const result = await database.query<Article>(sql, values);
    console.log(`✅ ${count} articles seeded`);

    // Link articles to categories in the join table
    try {
      // The DB returns inserted rows which include `id` — cast rows to include `id` to satisfy TypeScript
      const inserted = result.rows as Array<Article & { id: number }>;
      const joinValues: number[] = [];
      const joinPlaceholders: string[] = [];

      inserted.forEach((art, i) => {
        const cats = articles[i].categories || [];
        cats.forEach((catId) => {
          joinValues.push(art.id, catId);
          const idx = joinValues.length;
          joinPlaceholders.push(`($${idx - 1}, $${idx})`);
        });
      });

      if (joinPlaceholders.length > 0) {
        const joinSql = SeedQueries.insertArticleCategories(joinPlaceholders.join(','));
        await database.query(joinSql, joinValues);
        console.log(`✅ Linked ${joinPlaceholders.length} article-category entries`);
      }

      // Seed article discounts
      const discountValues: (number | string | Date)[] = [];
      const discountPlaceholders: string[] = [];

      inserted.forEach((art, i) => {
        const originalArticle = articles[i];
        if (originalArticle.discounted && originalArticle.expires_at) {
          const originalPrice = parseFloat(originalArticle.price);
          const discountPercent = faker.number.int({ min: 10, max: 50 }); // 10% to 50% off
          const discountedPrice = (originalPrice * (1 - discountPercent / 100)).toFixed(2);
          const categoryId = originalArticle.categories?.[0] || 1; // Use first category
          
          discountValues.push(
            art.id,
            originalArticle.supplier_id,
            categoryId,
            discountedPrice,
            originalArticle.expires_at
          );
          
          const offset = discountPlaceholders.length * 5;
          discountPlaceholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);
        }
      });

      if (discountPlaceholders.length > 0) {
        const discountSql = SeedQueries.insertArticleDiscounts(discountPlaceholders.join(','));
        await database.query(discountSql, discountValues);
        console.log(`✅ Seeded ${discountPlaceholders.length} article discounts`);
      }

    } catch (err) {
      console.error('⚠️ Failed to link articles to categories or seed discounts:', err);
    }

    return result;
  } catch (err) {
    console.error('❌ Article seeding failed:', err);
    throw err;
  }
};

export default seedArticles;
