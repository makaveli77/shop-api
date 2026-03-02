// Joi schema for Category
import Joi from 'joi';

export const CategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(255).optional(),
});
