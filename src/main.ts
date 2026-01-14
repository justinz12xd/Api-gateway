import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

/**
 * Bootstrap del API Gateway
 * 
 * Configura:
 * - CORS
 * - Helmet (seguridad headers)
 * - Validation Pipes
 * - Swagger Documentation
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const corsOrigins = configService.get<string[]>('cors.origins');

  // ============================================================
  // SECURITY
  // ============================================================
  
  // Helmet para headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: false, // Desactivar para permitir Swagger UI
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'Accept',
      'Origin',
    ],
    exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
    maxAge: 3600,
  });

  // ============================================================
  // VALIDATION
  // ============================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ============================================================
  // SWAGGER DOCUMENTATION
  // ============================================================
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Love4Pets API Gateway')
      .setDescription(`
## API Gateway para Love4Pets

Este API Gateway centraliza el acceso a todos los microservicios de Love4Pets.

### Microservicios:
- **REST API** (Rust/Axum): Operaciones CRUD, autenticación
- **GraphQL API** (Python/Strawberry): Consultas complejas, reportes
- **Payments Service** (Python/FastAPI): Procesamiento de pagos con Stripe
- **WebSocket Service** (NestJS): Notificaciones en tiempo real

### Autenticación:
- JWT Bearer Token
- Validación local de tokens Supabase

### Rate Limiting:
- 10 req/seg (corto plazo)
- 50 req/10seg (medio plazo)
- 100 req/min (largo plazo)
      `)
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token from Supabase authentication',
      })
      .addTag('Health', 'Health check endpoints')
      .addTag('Auth Proxy', 'Authentication routes')
      .addTag('REST API Proxy', 'REST API routes')
      .addTag('GraphQL Proxy', 'GraphQL endpoint')
      .addTag('Payments Proxy', 'Payment processing routes')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`📚 Swagger documentation available at http://localhost:${port}/docs`);
  }

  // ============================================================
  // START SERVER
  // ============================================================
  const actualPort = port ?? 3001;
  await app.listen(actualPort);

  logger.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Love4Pets API Gateway running on port ${port}             ║
║                                                              ║
║   Routes:                                                    ║
║   ├── /auth/*     → REST API (Rust)                         ║
║   ├── /api/*      → REST API (Rust)                         ║
║   ├── /graphql    → GraphQL API (Python)                    ║
║   ├── /payments/* → Payments Service (Python)               ║
║   └── /health/*   → Health Checks                           ║
║                                                              ║
║   Documentation: http://localhost:${port}/docs                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
