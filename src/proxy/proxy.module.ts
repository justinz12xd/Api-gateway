import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import {
  PaymentsProxyController,
  RestProxyController,
  GraphQLProxyController,
  AuthProxyController,
  McpProxyController,
} from './controllers';
import { ProxyService } from './services';

/**
 * Módulo Proxy
 * 
 * Centraliza el enrutamiento de peticiones a los microservicios:
 * - /payments/* → Payments Service (:8001)
 * - /api/* → REST API (:8080)
 * - /graphql → GraphQL API (:8000)
 * - /auth/* → Auth (actualmente REST, futuro Auth Service)
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000, // 30 segundos timeout
      maxRedirects: 3,
    }),
  ],
  controllers: [
    AuthProxyController,      // /auth/*
    PaymentsProxyController,  // /payments/*
    RestProxyController,      // /api/*
    GraphQLProxyController,   // /graphql
    McpProxyController,       // /mcp/* - Pilar 3
  ],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
