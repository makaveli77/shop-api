import { db } from '../config/db';
import { Category } from '../types';
import CategoryQueries from '../queries/category.queries';

const CategoryRepository = {
  async addCategories(articleId: number, categoryIds: number[]): Promise<void> {
    if (!categoryIds.length) return;
    const values: any[] = [];
    const placeholders = categoryIds.map((catId, i) => {
      values.push(articleId, catId);
      return `($${i * 2 + 1}, $${i * 2 + 2})`;
    }).join(',');
    const sql = CategoryQueries.addCategories(placeholders);
    await db.query(sql, values);
  },

  async removeCategories(articleId: number): Promise<void> {
    await db.query(CategoryQueries.removeCategories, [articleId]);
  },

  async getCategories(articleId: number): Promise<number[]> {
    const { rows } = await db.query(CategoryQueries.getCategories, [articleId]);
    return rows.map(r => r.category_id);
  },
  async findById(id: number): Promise<Category | undefined> {
    const { rows } = await db.query<Category>(CategoryQueries.findById, [id]);
    return rows[0];
  },

  async findAll(): Promise<Category[]> {
    const { rows } = await db.query<Category>(CategoryQueries.findAll);
    return rows;
  },

  async save(category: Partial<Category>): Promise<Category> {
    const { rows } = await db.query<Category>(
      CategoryQueries.save,
      [category.name, category.description, category.created_at, category.updated_at, category.deleted_at]
    );
    return rows[0];
  },

  async update(id: number, category: Partial<Category>): Promise<Category | undefined> {
    const { rows } = await db.query<Category>(
      CategoryQueries.update,
      [category.name, category.description, id]
    );
    return rows[0];
  },

  async softDelete(id: number): Promise<Category | undefined> {
    const { rows } = await db.query<Category>(
      CategoryQueries.softDelete,
      [id]
    );
    return rows[0];
  }
};

export default CategoryRepository;
