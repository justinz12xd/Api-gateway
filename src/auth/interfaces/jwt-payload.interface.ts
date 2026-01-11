/**
 * Interface para el payload del JWT
 * Compatible con tokens de Supabase y del Auth Service
 */
export interface JwtPayload {
  /** ID del usuario (subject) */
  sub: string;

  /** Email del usuario */
  email?: string;

  /** Rol del usuario: normal, refugio, admin */
  role?: string;

  /** Timestamp de emisión */
  iat?: number;

  /** Timestamp de expiración */
  exp?: number;

  /** Emisor del token */
  iss?: string;

  /** Audiencia del token */
  aud?: string | string[];

  /** ID del refugio (si el usuario es de tipo refugio) */
  id_refugio?: string;

  /** Nombre del usuario */
  nombre?: string;
}

/**
 * Interface para el usuario autenticado
 * Se adjunta al request después de validar el JWT
 */
export interface AuthenticatedUser {
  userId: string;
  email?: string;
  role: string;
  idRefugio?: string;
  nombre?: string;
}
