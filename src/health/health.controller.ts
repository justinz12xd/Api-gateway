import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators';

/**
 * Controlador de Health Check
 * 
 * Proporciona endpoints para verificar el estado del API Gateway
 * y de todos los microservicios conectados.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Health check básico del Gateway
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check del API Gateway' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  basicHealth() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Health check detallado de todos los servicios
   */
  @Public()
  @Get('all')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check de todos los microservicios' })
  @ApiResponse({ status: 200, description: 'All services status' })
  async checkAll(): Promise<HealthCheckResult> {
    const restUrl = this.configService.get<string>('services.restApiUrl');
    const graphqlUrl = this.configService.get<string>('services.graphqlApiUrl');
    const paymentsUrl = this.configService.get<string>('services.paymentsApiUrl');

    return this.health.check([
      // REST API (Rust)
      () => this.http.pingCheck('rest-api', `${restUrl}/api/health`),
      
      // GraphQL API (Python)
      () => this.http.pingCheck('graphql-api', `${graphqlUrl}/health`),
      
      // Payments Service
      () => this.http.pingCheck('payments-service', `${paymentsUrl}/health`),
    ]);
  }

  /**
   * Health check solo del REST API
   */
  @Public()
  @Get('rest')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check del REST API' })
  async checkRest(): Promise<HealthCheckResult> {
    const restUrl = this.configService.get<string>('services.restApiUrl');
    
    return this.health.check([
      () => this.http.pingCheck('rest-api', `${restUrl}/api/health`),
    ]);
  }

  /**
   * Health check solo del GraphQL API
   */
  @Public()
  @Get('graphql')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check del GraphQL API' })
  async checkGraphQL(): Promise<HealthCheckResult> {
    const graphqlUrl = this.configService.get<string>('services.graphqlApiUrl');
    
    return this.health.check([
      () => this.http.pingCheck('graphql-api', `${graphqlUrl}/health`),
    ]);
  }

  /**
   * Health check solo del Payments Service
   */
  @Public()
  @Get('payments')
  @HealthCheck()
  @ApiOperation({ summary: 'Health check del Payments Service' })
  async checkPayments(): Promise<HealthCheckResult> {
    const paymentsUrl = this.configService.get<string>('services.paymentsApiUrl');
    
    return this.health.check([
      () => this.http.pingCheck('payments-service', `${paymentsUrl}/health`),
    ]);
  }
}
