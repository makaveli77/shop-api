import Joi from 'joi';

export const supplierSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  company_name: Joi.string().min(2).max(100).required(),
  city: Joi.string().min(2).max(100).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  company_name: Joi.string().min(2).max(100).optional(),
  city: Joi.string().min(2).max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});
