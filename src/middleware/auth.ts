/// <reference path="../types/express.d.ts" />
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types';

const SECRET = process.env.JWT_SECRET || 'secret';

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get second part of "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ error: "Token missing" });
    return;
  }

  try {
    const verified = jwt.verify(token, SECRET) as JWTPayload;
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};

export { authenticate, SECRET };
