import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces';

/**
 * Decorador para obtener el usuario actual del request
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return { userId: user.userId, email: user.email };
 * }
 * 
 * // También puedes obtener una propiedad específica
 * @Get('my-id')
 * getMyId(@CurrentUser('userId') userId: string) {
 *   return { userId };
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // Si no hay usuario, retornar undefined
    if (!user) {
      return undefined;
    }

    // Si se especificó una propiedad, retornar solo esa
    if (data) {
      return user[data];
    }

    // Retornar el usuario completo
    return user;
  },
);
