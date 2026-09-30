// Puerta de entrada para el proveedor de Google.
//
// Existe por un agujero concreto: `authOptions` registra GoogleProvider junto a
// PrismaAdapter y NO tenia callback `signIn`. Con esa combinacion, NextAuth crea
// el usuario la primera vez que alguien entra con su cuenta de Google, y el
// `User` nace con los valores por defecto del esquema: `role = MEDICO`,
// `status = "ACTIVO"`, `tenantId = NULL`.
//
// Es decir: cualquier persona de internet con una cuenta de Google se daba de
// alta sola como medico activo de la plataforma.
//
// NO se desactiva el proveedor porque hay gente que lo usa a diario. Se exige
// que el usuario YA exista y este activo: los de siempre entran, los
// desconocidos dejan de registrarse solos.
//
// La decision vive aqui, separada de `auth.ts`, para poder probarla sin montar
// NextAuth ni base de datos.

/** Lo minimo que hace falta saber del usuario para decidir. Nada de PHI. */
export interface UsuarioParaPuerta {
  status: string;
  deletedAt: Date | null;
}

export type MotivoRechazo = 'sin-correo' | 'sin-usuario' | 'inactivo' | 'borrado';

export type DecisionPuerta =
  | { permitido: true }
  | { permitido: false; motivo: MotivoRechazo };

/** Mismo criterio que usa el proveedor de credenciales al buscar por correo. */
export function normalizarCorreo(correo: string | null | undefined): string | null {
  const limpio = (correo ?? '').toLowerCase().trim();
  return limpio === '' ? null : limpio;
}

/**
 * Decide si una cuenta de Google puede entrar.
 *
 * Se rechaza por omision: si falta el correo, o no hay usuario, o esta inactivo
 * o borrado, no entra. Cualquier caso no contemplado cae del lado seguro.
 *
 * Los motivos se distinguen para poder registrarlos, no para contarselos a quien
 * intenta entrar: al usuario se le responde siempre lo mismo, porque decirle
 * "ese correo no existe" confirmaria que otros si.
 */
export function decidirEntradaGoogle(
  correo: string | null | undefined,
  usuario: UsuarioParaPuerta | null | undefined
): DecisionPuerta {
  if (normalizarCorreo(correo) === null) {
    return { permitido: false, motivo: 'sin-correo' };
  }
  if (!usuario) {
    return { permitido: false, motivo: 'sin-usuario' };
  }
  if (usuario.deletedAt !== null && usuario.deletedAt !== undefined) {
    return { permitido: false, motivo: 'borrado' };
  }
  if (usuario.status !== 'ACTIVO') {
    return { permitido: false, motivo: 'inactivo' };
  }
  return { permitido: true };
}
