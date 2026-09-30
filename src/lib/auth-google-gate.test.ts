import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { decidirEntradaGoogle, normalizarCorreo } from './auth-google-gate';

const ACTIVO = { status: 'ACTIVO', deletedAt: null };

describe('el agujero que esto cierra', () => {
  it('un desconocido con cuenta de Google NO entra', () => {
    // Antes de este callback, PrismaAdapter le creaba el usuario al vuelo con
    // role=MEDICO y status=ACTIVO. Auto-registro abierto desde internet.
    const d = decidirEntradaGoogle('desconocido@gmail.com', null);
    expect(d.permitido).toBe(false);
    expect(d).toMatchObject({ motivo: 'sin-usuario' });
  });

  it('quien ya tiene usuario activo sigue entrando', () => {
    // No se desactiva el proveedor: hay gente que lo usa a diario.
    expect(decidirEntradaGoogle('doctor@clinica.com', ACTIVO)).toEqual({ permitido: true });
  });
});

describe('decidirEntradaGoogle', () => {
  it('rechaza a un usuario inactivo', () => {
    expect(decidirEntradaGoogle('x@y.com', { status: 'INACTIVO', deletedAt: null }))
      .toMatchObject({ permitido: false, motivo: 'inactivo' });
  });

  it('rechaza a un usuario borrado aunque figure como ACTIVO', () => {
    // El borrado lógico manda sobre el estado: un registro borrado con status
    // ACTIVO sin limpiar no debe volver a abrir la puerta.
    expect(decidirEntradaGoogle('x@y.com', { status: 'ACTIVO', deletedAt: new Date() }))
      .toMatchObject({ permitido: false, motivo: 'borrado' });
  });

  it('rechaza cuando Google no devuelve correo', () => {
    expect(decidirEntradaGoogle(null, ACTIVO)).toMatchObject({ permitido: false, motivo: 'sin-correo' });
    expect(decidirEntradaGoogle('   ', ACTIVO)).toMatchObject({ permitido: false, motivo: 'sin-correo' });
  });

  it('rechaza por omisión: sin correo y sin usuario tampoco pasa', () => {
    expect(decidirEntradaGoogle(undefined, undefined).permitido).toBe(false);
  });

  it('un deletedAt indefinido se trata como no borrado', () => {
    // Prisma devuelve null, pero un objeto construido a mano puede traer undefined.
    expect(decidirEntradaGoogle('x@y.com', { status: 'ACTIVO', deletedAt: undefined as unknown as null }))
      .toEqual({ permitido: true });
  });
});

describe('normalizarCorreo', () => {
  it('usa el mismo criterio que el proveedor de credenciales', () => {
    expect(normalizarCorreo('  Doctor@Clinica.COM ')).toBe('doctor@clinica.com');
  });

  it('el vacío es null, no cadena vacía: así no se busca por "" en la base', () => {
    expect(normalizarCorreo('')).toBeNull();
    expect(normalizarCorreo('   ')).toBeNull();
    expect(normalizarCorreo(null)).toBeNull();
    expect(normalizarCorreo(undefined)).toBeNull();
  });
});

describe('el callback está efectivamente conectado', () => {
  // La lógica puede ser perfecta y no servir de nada si nadie la invoca: el
  // agujero original era exactamente ese, un guard que no se llamaba.
  const fuente = readFileSync(path.join(process.cwd(), 'src/lib/auth.ts'), 'utf-8');

  it('auth.ts define un callback signIn', () => {
    expect(fuente).toMatch(/async signIn\(/);
  });

  it('y usa la decisión de este módulo', () => {
    expect(fuente).toContain('decidirEntradaGoogle');
  });

  it('solo filtra Google: credenciales ya validó en authorize()', () => {
    expect(fuente).toContain('account?.provider !== "google"');
  });
});
