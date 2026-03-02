import Joi from 'joi';

const singleDiscountSchema = Joi.object({
  article_id: Joi.number().integer().required(),
  discounted_price: Joi.number().min(0).required(),
  expires_at: Joi.date().iso().allow(null, '')
});

const discountSchema = Joi.alternatives().try(
  singleDiscountSchema,
  Joi.array().items(singleDiscountSchema).min(1).max(500)
);

export { discountSchema, singleDiscountSchema };
