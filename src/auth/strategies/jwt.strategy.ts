import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '../interfaces';

/**
 * JWT Strategy para validación LOCAL de tokens
 * 
 * Implementa el requisito del Pilar 1:
 * "Los demás servicios deben validar tokens localmente
 * (verificando firma y expiración) sin consultar al Auth Service"
 * 
 * @pattern Strategy Pattern - Permite intercambiar estrategias de autenticación
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly configService: ConfigService) {
    super({
      // Extraer token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      
      // No ignorar expiración - tokens expirados son inválidos
      ignoreExpiration: false,
      
      // Secret compartido con el Auth Service para validación LOCAL
      secretOrKey: configService.get<string>('JWT_SECRET'),
      
      // Opciones de validación
      algorithms: ['HS256'],
    });

    this.logger.log('JWT Strategy initialized - Local validation enabled');
  }

  /**
   * Valida el payload del JWT y retorna el usuario autenticado
   * Este método se llama DESPUÉS de verificar la firma y expiración
   * 
   * @param payload - Payload decodificado del JWT
   * @returns Usuario autenticado para adjuntar al request
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    this.logger.debug(`Validating JWT for user: ${payload.sub}`);

    // Validar que el payload tenga los campos mínimos
    if (!payload.sub) {
      this.logger.warn('JWT payload missing subject (sub)');
      throw new UnauthorizedException('Token inválido: falta identificador de usuario');
    }

    // Validar audiencia si está configurada
    const expectedAudience = this.configService.get<string>('JWT_AUDIENCE');
    if (expectedAudience && payload.aud) {
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (!audiences.includes(expectedAudience)) {
        this.logger.warn(`Invalid audience: ${payload.aud}, expected: ${expectedAudience}`);
        throw new UnauthorizedException('Token inválido: audiencia incorrecta');
      }
    }

    // Construir usuario autenticado
    const user: AuthenticatedUser = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'normal',
      idRefugio: payload.id_refugio,
      nombre: payload.nombre,
    };

    this.logger.debug(`User authenticated: ${user.userId} (${user.role})`);
    return user;
  }
}
