import { SetMetadata } from '@nestjs/common';

/**
 * Key para identificar roles requeridos en los metadatos
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir acceso por roles
 * 
 * @param roles - Lista de roles permitidos
 * 
 * @example
 * ```typescript
 * @Roles('admin', 'refugio')
 * @Get('admin/users')
 * getUsers() {
 *   return this.userService.findAll();
 * }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
