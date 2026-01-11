import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';

/**
 * Módulo de Health Check
 * 
 * Usa @nestjs/terminus para health checks estandarizados
 */
@Module({
  imports: [
    TerminusModule,
    HttpModule,
    ConfigModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
