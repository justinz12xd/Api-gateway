import {
  Controller,
  All,
  Req,
  Res,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../services';
import { JwtAuthGuard } from '../../auth/guards';
import { Public } from '../../auth/decorators';

/**
 * Controlador Proxy para Payments Service
 * 
 * Ruta: /payments/* → Payments Microservice (:8001)
 * 
 * Implementa el Pilar 2 de la rúbrica:
 * - Wrapper del servicio de pago
 * - Routing a través del API Gateway
 */
@ApiTags('Payments Proxy')
@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsProxyController {
  private readonly logger = new Logger(PaymentsProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Proxy para Health Check de Payments (público)
   */
  @Public()
  @All('health')
  @ApiOperation({ summary: 'Health check del servicio de pagos' })
  async healthCheck(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('payments', '/health', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Proxy para Webhooks de Stripe (público - tiene su propia auth)
   */
  @Public()
  @All('webhooks/stripe')
  @ApiOperation({ summary: 'Webhook de Stripe' })
  async stripeWebhook(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Forwarding Stripe webhook');
    const result = await this.proxyService.forward('payments', '/webhooks/stripe', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Proxy para crear pagos (requiere auth)
   */
  @All()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un pago/donación' })
  async createPayment(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('payments', '/', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Proxy para todas las rutas de payments (requiere auth)
   */
  @All('*')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy genérico a Payments Service' })
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    // Extraer el path después de /payments
    const path = req.url.replace(/^\/payments/, '') || '/';
    
    this.logger.debug(`Proxying to payments: ${req.method} ${path}`);
    
    const result = await this.proxyService.forward('payments', path, req);
    return res.status(result.status).json(result.data);
  }
}
