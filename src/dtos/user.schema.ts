import Joi from 'joi';

const registerSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  address: Joi.string().max(255).allow(null, ''),
  phone_number: Joi.string().max(50).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  country_code: Joi.string().length(2).uppercase().allow(null, ''),
  ip_address: Joi.string().max(45).allow(null, '')
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  address: Joi.string().max(255).allow(null, ''),
  phone_number: Joi.string().max(50).allow(null, ''),
  date_of_birth: Joi.date().iso().allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  country_code: Joi.string().length(2).uppercase().allow(null, '')
});

export { registerSchema, updateUserSchema };
