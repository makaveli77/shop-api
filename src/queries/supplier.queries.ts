const SupplierQueries = {
  save: `
    INSERT INTO supplier (name, company_name, city, latitude, longitude, created_at) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *
  `,
  findById: `
    SELECT * FROM supplier WHERE id = $1
  `,
  findAll: `
    SELECT * FROM supplier LIMIT $1 OFFSET $2
  `,
  update: `
    UPDATE supplier 
    SET name = $1, company_name = $2, city = $3, latitude = $4, longitude = $5 
    WHERE id = $6 
    RETURNING *
  `,
  delete: `
    DELETE FROM supplier WHERE id = $1 RETURNING *
  `
};

export default SupplierQueries;
