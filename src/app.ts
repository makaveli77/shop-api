import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import routes from './routes/routes';

const app: Application = express();

// --- GLOBAL MIDDLEWARE ---
app.use(compression());
app.use(cors());

// Ensure Stripe Webhooks get raw buffer before express.json() parses it.
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/webhooks/stripe' || req.originalUrl.startsWith('/api/webhooks/stripe') || req.originalUrl.includes('/webhooks/stripe')) {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// Serve uploaded files statically so they are viewable in browser
app.use('/uploads', express.static('uploads'));

// --- ROUTES ---
app.use('/', routes);

// --- GLOBAL ERROR HANDLER ---
interface CustomError extends Error {
  status?: number;
  isJoi?: boolean;
  details?: any[];
}

app.use((err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  // Log error stack for debugging
  console.error(err.stack || err);

  // Handle Joi validation errors
  if (err.isJoi) {
    res.status(400).json({
      status: 'error',
      errors: err.details ? err.details.map((d: any) => d.message) : [err.message]
    });
    return;
  }

  // Handle custom status or fallback to 500
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {})
  });
});

export default app;
