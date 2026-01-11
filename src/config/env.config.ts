import { registerAs } from '@nestjs/config';

/**
 * Configuración del entorno de la aplicación
 * Patrón: Configuration Module Pattern
 */
export const envConfig = registerAs('env', () => ({
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // JWT - Validación local (Pilar 1 - Validación sin llamar al Auth Service)
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'love4pets-auth',
    audience: process.env.JWT_AUDIENCE || 'authenticated',
  },

  // Microservices URLs
  services: {
    rest: process.env.REST_API_URL || 'http://localhost:8080',
    graphql: process.env.GRAPHQL_API_URL || 'http://localhost:8000',
    payments: process.env.PAYMENTS_API_URL || 'http://localhost:8001',
    websocket: process.env.WEBSOCKET_API_URL || 'http://localhost:4000',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',
}));

/**
 * Tipo para acceder a la configuración de forma tipada
 */
export type EnvConfig = ReturnType<typeof envConfig>;
