import {
  Controller,
  All,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from '../services';
import { Public } from '../../auth/decorators';

/**
 * Controlador Proxy para Auth Service (Pilar 1)
 * 
 * Ruta: /auth/* → Auth Service (JWT-AUTH) en puerto 8090
 * 
 * Implementa el Pilar 1 de la rúbrica:
 * - Auth Service independiente (microservicio dedicado)
 * - JWT con access y refresh tokens
 * - Validación local en el API Gateway (sin HTTP calls al Auth Service)
 * - Base de datos propia para usuarios y tokens
 * - Rate limiting y blacklist de tokens
 * 
 * Endpoints:
 * - POST /auth/register - Registrar nuevo usuario
 * - POST /auth/login - Autenticar y obtener tokens
 * - POST /auth/logout - Revocar tokens (cerrar sesión)
 * - POST /auth/refresh - Renovar access token
 * - GET /auth/me - Obtener información del usuario autenticado
 * - GET /auth/validate - Validar token (endpoint interno)
 */
@ApiTags('Auth Proxy')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Login - Público
   * POST /auth/login
   */
  @Public()
  @All('login')
  @ApiOperation({ summary: 'Iniciar sesión - Auth Service' })
  async login(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing login request → Auth Service');
    
    // Redirigir al Auth Service dedicado (Pilar 1)
    const result = await this.proxyService.forward('auth', '/auth/login', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Registro - Público
   * POST /auth/register
   */
  @Public()
  @All('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario - Auth Service' })
  async register(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing registration request → Auth Service');
    
    const result = await this.proxyService.forward('auth', '/auth/register', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Logout - Público (no requiere token válido para llamar)
   * POST /auth/logout
   */
  @Public()
  @All('logout')
  @ApiOperation({ summary: 'Cerrar sesión - Auth Service' })
  async logout(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing logout request → Auth Service');
    
    const result = await this.proxyService.forward('auth', '/auth/logout', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Refresh Token - Público (usa el refresh token, no access token)
   * POST /auth/refresh
   */
  @Public()
  @All('refresh')
  @ApiOperation({ summary: 'Refrescar access token - Auth Service' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing token refresh → Auth Service');
    
    const result = await this.proxyService.forward('auth', '/auth/refresh', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Me - Requiere autenticación
   * GET /auth/me
   */
  @All('me')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado - Auth Service' })
  async me(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing me request → Auth Service');
    
    const result = await this.proxyService.forward('auth', '/auth/me', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Validate - Endpoint interno para validar tokens
   * GET /auth/validate
   * 
   * Nota: La validación LOCAL en el API Gateway es preferida.
   * Este endpoint existe para casos donde otros servicios
   * necesiten verificar tokens explícitamente.
   */
  @All('validate')
  @ApiOperation({ summary: 'Validar token (interno) - Auth Service' })
  async validate(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing validate request → Auth Service');
    
    const result = await this.proxyService.forward('auth', '/auth/validate', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Proxy genérico para otras rutas de auth (fallback)
   * Redirige cualquier otra ruta /auth/* al Auth Service
   */
  @Public()
  @All('*')
  @ApiOperation({ summary: 'Otras rutas de auth - Auth Service' })
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const path = req.url;
    
    this.logger.debug(`Proxying auth: ${req.method} ${path} → Auth Service`);
    
    const result = await this.proxyService.forward('auth', path, req);
    return res.status(result.status).json(result.data);
  }
}
