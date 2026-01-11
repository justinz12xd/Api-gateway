import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

// Configuration
import { envConfig, envValidationSchema } from './config';

// Modules
import { AuthModule } from './auth';
import { ProxyModule } from './proxy';
import { HealthModule } from './health';

// Guards & Interceptors
import { JwtAuthGuard, RolesGuard } from './auth/guards';
import { LoggingInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Módulo Principal del API Gateway
 * 
 * Arquitectura:
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      API GATEWAY                            │
 * │  ┌─────────────────────────────────────────────────────┐   │
 * │  │              Global Guards & Filters                 │   │
 * │  │  - ThrottlerGuard (Rate Limiting)                   │   │
 * │  │  - JwtAuthGuard (Authentication)                    │   │
 * │  │  - RolesGuard (Authorization)                       │   │
 * │  │  - HttpExceptionFilter (Error Handling)             │   │
 * │  │  - LoggingInterceptor (Request/Response Logging)    │   │
 * │  └─────────────────────────────────────────────────────┘   │
 * │                                                             │
 * │  ┌─────────────────────────────────────────────────────┐   │
 * │  │                   Modules                            │   │
 * │  │                                                      │   │
 * │  │  AuthModule     - JWT validation, guards            │   │
 * │  │  ProxyModule    - Route proxying to microservices   │   │
 * │  │  HealthModule   - Health check endpoints            │   │
 * │  └─────────────────────────────────────────────────────┘   │
 * │                                                             │
 * │  ┌─────────────────────────────────────────────────────┐   │
 * │  │              Proxy Routes                            │   │
 * │  │                                                      │   │
 * │  │  /auth/*     → REST API (:8080)                     │   │
 * │  │  /api/*      → REST API (:8080)                     │   │
 * │  │  /graphql    → GraphQL API (:8000)                  │   │
 * │  │  /payments/* → Payments Service (:8001)             │   │
 * │  │  /health/*   → Local health checks                  │   │
 * │  └─────────────────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────────────────┘
 */
@Module({
  imports: [
    // ============================================================
    // CONFIGURATION
    // ============================================================
    ConfigModule.forRoot({
      isGlobal: true,
      load: [envConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
      },
    }),

    // ============================================================
    // RATE LIMITING
    // ============================================================
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requests
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 50, // 50 requests
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),

    // ============================================================
    // FEATURE MODULES
    // ============================================================
    AuthModule,
    ProxyModule,
    HealthModule,
  ],
  
  providers: [
    // ============================================================
    // GLOBAL GUARDS (orden importa)
    // ============================================================
    
    // 1. Rate Limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    
    // 2. JWT Authentication
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    
    // 3. Role-based Authorization
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // ============================================================
    // GLOBAL INTERCEPTORS
    // ============================================================
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    // ============================================================
    // GLOBAL EXCEPTION FILTERS
    // ============================================================
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
