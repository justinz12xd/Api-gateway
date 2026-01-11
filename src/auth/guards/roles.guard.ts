import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';
import { AuthenticatedUser } from '../types';

/**
 * Guard para control de acceso basado en roles
 * 
 * Verifica que el usuario tenga el rol requerido para acceder a la ruta
 * Debe usarse DESPUÉS del JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Verifica si el usuario tiene el rol requerido
   * 
   * @param context - Contexto de ejecución
   * @returns true si el usuario tiene el rol, false si no
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request (adjuntado por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // Si no hay usuario, denegar acceso
    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado. Rol requerido: ${requiredRoles.join(' o ')}`,
      );
    }

    return true;
  }
}
