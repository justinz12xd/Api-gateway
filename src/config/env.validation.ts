import * as Joi from 'joi';

/**
 * Validación de variables de entorno con Joi
 * Asegura que todas las variables requeridas estén presentes
 */
export const envValidationSchema = Joi.object({
  // Server
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // JWT
  JWT_SECRET: Joi.string().required().messages({
    'string.empty': 'JWT_SECRET es requerido para validación de tokens',
    'any.required': 'JWT_SECRET es requerido para validación de tokens',
  }),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_ISSUER: Joi.string().default('love4pets-auth'),
  JWT_AUDIENCE: Joi.string().default('authenticated'),

  // Microservices
  REST_API_URL: Joi.string().uri().default('http://localhost:8080'),
  GRAPHQL_API_URL: Joi.string().uri().default('http://localhost:8000'),
  PAYMENTS_API_URL: Joi.string().uri().default('http://localhost:8001'),
  WEBSOCKET_API_URL: Joi.string().uri().default('http://localhost:4000'),
  AUTH_SERVICE_URL: Joi.string().uri().default('http://localhost:3002'),

  // Throttle
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),

  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'log', 'debug', 'verbose')
    .default('debug'),
});
