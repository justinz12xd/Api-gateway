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
 * Controlador Proxy para Auth
 * 
 * Ruta: /auth/* → REST API (:8080) o Auth Service (:3002 futuro)
 * 
 * Actualmente delega al REST API (Rust), pero está preparado
 * para cuando se implemente el Auth Service dedicado.
 * 
 * Implementa Pilar 1 de la rúbrica:
 * - Login/Logout
 * - Registro
 * - Validación de tokens (JWT local)
 */
@ApiTags('Auth Proxy')
@Controller('auth')
export class AuthProxyController {
  private readonly logger = new Logger(AuthProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Login - Público
   */
  @Public()
  @All('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  async login(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing login request');
    
    // TODO: Cuando exista Auth Service dedicado, cambiar a 'auth'
    const result = await this.proxyService.forward('rest', '/api/auth/login', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Registro - Público
   */
  @Public()
  @All('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  async register(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing registration request');
    
    const result = await this.proxyService.forward('rest', '/api/auth/register', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Logout - Público (no requiere token válido para llamar)
   */
  @Public()
  @All('logout')
  @ApiOperation({ summary: 'Cerrar sesión' })
  async logout(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing logout request');
    
    const result = await this.proxyService.forward('rest', '/api/auth/logout', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Refresh Token - Público (usa el refresh token, no access token)
   */
  @Public()
  @All('refresh')
  @ApiOperation({ summary: 'Refrescar access token' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Processing token refresh');
    
    const result = await this.proxyService.forward('rest', '/api/auth/refresh', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Forgot Password - Público
   */
  @Public()
  @All('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  async forgotPassword(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('rest', '/api/auth/forgot-password', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Reset Password - Público (usa token de email)
   */
  @Public()
  @All('reset-password')
  @ApiOperation({ summary: 'Resetear contraseña con token' })
  async resetPassword(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('rest', '/api/auth/reset-password', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Verify Email - Público
   */
  @Public()
  @All('verify-email')
  @ApiOperation({ summary: 'Verificar email con token' })
  async verifyEmail(@Req() req: Request, @Res() res: Response) {
    const result = await this.proxyService.forward('rest', '/api/auth/verify-email', req);
    return res.status(result.status).json(result.data);
  }

  /**
   * Proxy genérico para otras rutas de auth
   */
  @Public()
  @All('*')
  @ApiOperation({ summary: 'Otras rutas de auth' })
  async proxyAll(@Req() req: Request, @Res() res: Response) {
    const path = req.url.replace(/^\/auth/, '/api/auth');
    
    this.logger.debug(`Proxying auth: ${req.method} ${path}`);
    
    const result = await this.proxyService.forward('rest', path, req);
    return res.status(result.status).json(result.data);
  }
}
