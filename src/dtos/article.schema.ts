import Joi from 'joi';

const singleArticleSchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  price: Joi.number().min(0).required(),
  supplier_id: Joi.number().integer().required(),
  slug: Joi.string().lowercase().allow(null, ''),
  serial_number: Joi.string().max(100).allow(null, ''),
  country_code: Joi.string().length(2).uppercase().allow(null, ''),
  description: Joi.string().allow(null, ''),
  tags: Joi.array().items(Joi.string()).min(0).default([]),
  stock_quantity: Joi.number().integer().min(0).default(0),
  discounted: Joi.boolean().default(false),
  expires_at: Joi.date().iso().allow(null, ''),
  categories: Joi.array().items(Joi.number().integer()).min(0)
});

const batchArticleSchema = Joi.array().items(singleArticleSchema).min(1).max(100);

export { singleArticleSchema, batchArticleSchema };
