import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators';

/**
 * Guard para proteger rutas con autenticación JWT
 * 
 * Verifica el token JWT en el header Authorization
 * Permite rutas públicas marcadas con @Public()
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determina si la ruta puede ser activada
   * 
   * @param context - Contexto de ejecución
   * @returns true si la ruta es pública o el JWT es válido
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Verificar si la ruta está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Las rutas públicas no requieren autenticación
    if (isPublic) {
      return true;
    }

    // Rutas protegidas requieren JWT válido
    return super.canActivate(context);
  }
}
