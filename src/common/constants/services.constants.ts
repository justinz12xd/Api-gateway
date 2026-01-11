/**
 * Constantes de los servicios backend
 * Centraliza la configuración de routing
 */
export const SERVICES = {
  REST: {
    name: 'REST_API',
    prefix: '/api',
    description: 'Core REST API (Rust/Axum)',
  },
  GRAPHQL: {
    name: 'GRAPHQL_API',
    prefix: '/graphql',
    description: 'GraphQL API (Python/Strawberry)',
  },
  PAYMENTS: {
    name: 'PAYMENTS_API',
    prefix: '/payments',
    description: 'Payments Microservice (Python/FastAPI)',
  },
  WEBSOCKET: {
    name: 'WEBSOCKET_API',
    prefix: '/ws',
    description: 'WebSocket Service (NestJS)',
  },
  AUTH: {
    name: 'AUTH_SERVICE',
    prefix: '/auth',
    description: 'Auth Microservice (Para implementar)',
  },
} as const;

/**
 * Rutas que NO requieren autenticación
 */
export const PUBLIC_ROUTES = [
  // Health checks
  '/health',
  '/health/*',
  
  // Auth endpoints (login, register)
  '/api/auth/login',
  '/api/auth/register',
  '/auth/login',
  '/auth/register',
  
  // GraphQL playground (solo en desarrollo)
  '/graphql',
  
  // Swagger/OpenAPI docs
  '/api/swagger-ui',
  '/api/api-doc/*',
  
  // Webhooks de Stripe (tienen su propia autenticación)
  '/payments/webhooks/*',
];

/**
 * Headers que se propagan a los servicios backend
 */
export const PROPAGATED_HEADERS = [
  'authorization',
  'content-type',
  'accept',
  'x-request-id',
  'x-forwarded-for',
  'x-real-ip',
  'user-agent',
];

/**
 * Headers que se añaden al proxear
 */
export const GATEWAY_HEADERS = {
  'X-Gateway': 'love4pets-api-gateway',
  'X-Gateway-Version': '1.0.0',
};
