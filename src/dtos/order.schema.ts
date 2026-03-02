import Joi from 'joi';

export const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        article_id: Joi.number().integer().positive().required().messages({
          'number.base': 'article_id must be a number',
          'number.positive': 'article_id must be a positive integer',
          'any.required': 'article_id is required'
        }),
        quantity: Joi.number().integer().positive().min(1).required().messages({
          'number.base': 'quantity must be a number',
          'number.min': 'quantity must be at least 1',
          'any.required': 'quantity is required'
        })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Order must contain at least one item',
      'any.required': 'items array is required'
    })
});

export const getOrdersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().optional(),
  user_id: Joi.number().integer().positive().optional(),
  created_at: Joi.date().iso().optional(),
  updated_at: Joi.date().iso().optional(),
  include_articles: Joi.boolean().default(false).optional()
});
