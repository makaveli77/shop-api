// Swagger configuration for the Article API
import swaggerJsdoc from 'swagger-jsdoc';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Article API',
      version: '1.0.0',
      description: 'A professional Article API with Node.js and PostgreSQL',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        GenericError: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Resource not found' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: ['"price" must be greater than or equal to 0']
            }
          }
        },
        RateLimitError: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { 
              type: 'string', 
              example: 'Too many requests from this IP, please try again after 15 minutes' 
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            is_locked: { type: 'boolean' }
          }
        },
        UserStats: {
          type: 'object',
          properties: {
            balance: { type: 'string', example: '150.50' },
            currency: { type: 'string', example: 'USD' },
            total_deposited: { type: 'string', example: '500.00' },
            total_withdrawn: { type: 'string', example: '200.00' },
            total_spent: { type: 'string', example: '149.50' },
            recent_transactions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  type: { type: 'string', enum: ['deposit', 'withdrawal', 'purchase'] },
                  amount: { type: 'string' },
                  description: { type: 'string' },
                  reference_id: { type: 'integer' },
                  external_reference_id: { type: 'string', nullable: true },
                  date: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      headers: {
        RateLimitLimit: {
          description: 'The maximum number of requests allowed in the window.',
          schema: { type: 'integer' }
        },
        RateLimitRemaining: {
          description: 'The number of requests remaining in the current window.',
          schema: { type: 'integer' }
        },
        RetryAfter: {
          description: 'The number of seconds to wait before making a new request.',
          schema: { type: 'integer' }
        }
      }
    },
  },
  apis: ['./src/app.ts', './src/controllers/*.ts'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export { swaggerOptions, swaggerSpec };
