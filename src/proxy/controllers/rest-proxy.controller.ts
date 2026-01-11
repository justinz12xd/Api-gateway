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
import { Public, Roles } from '../../auth/decorators';

/**
 * Controlador Proxy para REST API (Rust/Axum)
 * 
 * Ruta: /api/* → REST Microservice (:8080)
 * 
 * Incluye rutas para:
 * - Animales
 * - Refugios
 * - Usuarios
 * - Causas Urgentes
 * - Especies
 * - Adopciones
 * - etc.
 */
@ApiTags('REST API Proxy')
@Controller('api')
@UseGuards(JwtAuthGuard)
export class RestProxyController {
  private readonly logger = new Logger(RestProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  // ============================================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ============================================================

  /**
   * Health check del REST API
   */
  @Public()
  @All('health')
  @ApiOperation({ summary: 'Health check del REST API' })
  async healthCheck(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('rest', '/api/health', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Listar animales (público)
   */
  @Public()
  @All('animales')
  @ApiOperation({ summary: 'Listar animales disponibles' })
  async getAnimales(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const result = await this.proxyService.forward('rest', '/api/animales', req);
      return res.status(result.status).json(result.data);
    }
    // POST requiere auth, se manejará abajo
    return this.proxyProtected(req, res);
  }

  /**
   * Detalle de animal (público)
   */
  @Public()
  @All('animales/:id')
  @ApiOperation({ summary: 'Obtener detalle de un animal' })
  async getAnimalById(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const path = req.url.replace(/^\/api/, '/api');
      const result = await this.proxyService.forward('rest', path, req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  /**
   * Listar refugios (público)
   */
  @Public()
  @All('refugios')
  @ApiOperation({ summary: 'Listar refugios' })
  async getRefugios(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const result = await this.proxyService.forward('rest', '/api/refugios', req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  /**
   * Detalle de refugio (público)
   */
  @Public()
  @All('refugios/:id')
  @ApiOperation({ summary: 'Obtener detalle de un refugio' })
  async getRefugioById(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const path = req.url.replace(/^\/api/, '/api');
      const result = await this.proxyService.forward('rest', path, req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  /**
   * Listar causas urgentes (público)
   */
  @Public()
  @All('causas-urgentes')
  @ApiOperation({ summary: 'Listar causas urgentes' })
  async getCausasUrgentes(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const result = await this.proxyService.forward('rest', '/api/causas-urgentes', req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  /**
   * Detalle de causa urgente (público)
   */
  @Public()
  @All('causas-urgentes/:id')
  @ApiOperation({ summary: 'Obtener detalle de una causa urgente' })
  async getCausaUrgenteById(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const path = req.url.replace(/^\/api/, '/api');
      const result = await this.proxyService.forward('rest', path, req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  /**
   * Listar especies (público)
   */
  @Public()
  @All('especies')
  @ApiOperation({ summary: 'Listar especies' })
  async getEspecies(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('rest', '/api/especies', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Listar campañas (público)
   */
  @Public()
  @All('campanias')
  @ApiOperation({ summary: 'Listar campañas' })
  async getCampanias(@Req() req: Request, @Res() res: Response) {
    if (req.method === 'GET') {
      const result = await this.proxyService.forward('rest', '/api/campanias', req);
      return res.status(result.status).json(result.data);
    }
    return this.proxyProtected(req, res);
  }

  // ============================================================
  // PROXY GENÉRICO (rutas protegidas)
  // ============================================================

  /**
   * Proxy genérico para todas las demás rutas del REST API
   * Requiere autenticación
   */
  @All('*')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Proxy genérico a REST API (requiere auth)' })
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    return this.proxyProtected(req, res);
  }

  /**
   * Helper para rutas protegidas
   */
  private async proxyProtected(req: Request, res: Response) {
    // Verificar que hay usuario autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const path = req.url.replace(/^\/api/, '/api');
    this.logger.debug(`Proxying protected route: ${req.method} ${path}`);
    
    const result = await this.proxyService.forward('rest', path, req);
    return res.status(result.status).json(result.data);
  }
}
