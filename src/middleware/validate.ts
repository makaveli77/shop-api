import { Request, Response, NextFunction } from 'express';
import { ObjectSchema, ArraySchema, AlternativesSchema } from 'joi';

type RequestLocation = 'body' | 'query' | 'params';

const validate = 
  (schema: ObjectSchema | ArraySchema | AlternativesSchema, property: RequestLocation = 'body') => 
  (req: Request, res: Response, next: NextFunction): void => {
  const { error } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
  if (error) {
    res.status(400).json({ status: 'error', errors: error.details.map(d => d.message) });
    return;
  }
  next();
};

export default validate;
