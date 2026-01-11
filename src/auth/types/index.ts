/**
 * Tipos de usuario autenticado
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  aud: string;
  exp: number;
  iat: number;
}

/**
 * Roles de usuario disponibles
 */
export enum UserRole {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  REFUGIO = 'refugio',
  VOLUNTARIO = 'voluntario',
  USUARIO = 'usuario',
}

// Nota: El tipo user en Express.Request se extiende automáticamente
// por Passport cuando se usa JwtAuthGuard
