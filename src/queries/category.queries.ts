const CategoryQueries = {
  addCategories: (placeholders: string) => `
    INSERT INTO article_category (article_id, category_id) 
    VALUES ${placeholders} 
    ON CONFLICT DO NOTHING
  `,
  removeCategories: `
    DELETE FROM article_category WHERE article_id = $1
  `,
  getCategories: `
    SELECT category_id FROM article_category WHERE article_id = $1
  `,
  findById: `
    SELECT * FROM category WHERE id = $1 AND deleted_at IS NULL
  `,
  findAll: `
    SELECT * FROM category WHERE deleted_at IS NULL
  `,
  save: `
    INSERT INTO category (name, description, created_at, updated_at, deleted_at) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING *
  `,
  update: `
    UPDATE category 
    SET name = $1, description = $2, updated_at = NOW() 
    WHERE id = $3 AND deleted_at IS NULL 
    RETURNING *
  `,
  softDelete: `
    UPDATE category 
    SET deleted_at = NOW() 
    WHERE id = $1 
    RETURNING *
  `
};

export default CategoryQueries;
