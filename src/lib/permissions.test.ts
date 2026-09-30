import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { puedeUsarModulo, DEFAULT_PERMISSIONS, resolvePermissions } from './permissions';

const RAIZ = process.cwd();

describe('puedeUsarModulo', () => {
  it('ADMIN puede generar reportes', () => {
    // El caso que estaba roto en producción: el director del centro entra como
    // ADMIN y el botón le respondía «Solo personal médico puede generar
    // analíticas», aunque la matriz de permisos sí le da el módulo.
    expect(puedeUsarModulo({ role: 'ADMIN', permissions: null }, 'reportes')).toBe(true);
  });

  it('respeta la matriz para cada rol, sin excepciones escritas a mano', () => {
    for (const [rol, permisos] of Object.entries(DEFAULT_PERMISSIONS)) {
      for (const [modulo, esperado] of Object.entries(permisos)) {
        expect(puedeUsarModulo({ role: rol, permissions: null }, modulo as never)).toBe(esperado);
      }
    }
  });

  it('una sobreescritura guardada en la base gana sobre el valor del rol', () => {
    // Es el panel de permisos: el administrador puede conceder un módulo a un
    // usuario concreto sin cambiarle el rol.
    expect(puedeUsarModulo({ role: 'MEDICO', permissions: { reportes: true } }, 'reportes')).toBe(true);
    expect(puedeUsarModulo({ role: 'ADMIN', permissions: { reportes: false } }, 'reportes')).toBe(false);
  });

  it('sin sesión, sin rol o con rol desconocido: se deniega', () => {
    expect(puedeUsarModulo(null, 'reportes')).toBe(false);
    expect(puedeUsarModulo(undefined, 'reportes')).toBe(false);
    expect(puedeUsarModulo({ role: null }, 'reportes')).toBe(false);
    expect(puedeUsarModulo({ role: '' }, 'reportes')).toBe(false);
    // Un rol que no existe en la matriz cae en la reserva (MEDICO), que no
    // tiene reportes. El fallo va hacia el lado seguro.
    expect(puedeUsarModulo({ role: 'ROL_NUEVO' }, 'reportes')).toBe(false);
  });

  it('una sobreescritura de un módulo que no existe se ignora', () => {
    expect(puedeUsarModulo({ role: 'MEDICO', permissions: { inventado: true } as never }, 'reportes'))
      .toBe(false);
  });

  it('no se deja engañar por valores que no son booleanos', () => {
    // `resolvePermissions` fusiona lo que venga de la base. Un 'true' en texto
    // no debe abrir un módulo.
    expect(puedeUsarModulo({ role: 'MEDICO', permissions: { reportes: 'true' as never } }, 'reportes'))
      .toBe(false);
  });

  it('coincide con resolvePermissions: no es una segunda fuente de verdad', () => {
    for (const rol of Object.keys(DEFAULT_PERMISSIONS)) {
      const resueltos = resolvePermissions(rol as never, null);
      expect(puedeUsarModulo({ role: rol }, 'reportes')).toBe(resueltos.reportes);
    }
  });
});

// ─── La contradicción que dejaba el módulo inservible ─────────────────────────
//
// `reportes/page.tsx` tenía `if (session?.user?.role !== 'MEDICO')`, y la matriz
// de este archivo da `reportes` a ADMIN y ADMINISTRATIVO y se lo niega a MEDICO.
// Los dos únicos roles que llegaban a la pantalla eran justo los que el botón
// rechazaba, y el único que el botón aceptaba no podía llegar.

describe('el módulo de reportes es alcanzable por alguien', () => {
  // Invariante, no regresión: la matriz siempre concedió `reportes` a ALGUIEN.
  // El fallo estaba en que el cliente exigía otro rol distinto.
  it('al menos un rol tiene el módulo concedido', () => {
    const conReportes = Object.entries(DEFAULT_PERMISSIONS)
      .filter(([, permisos]) => permisos.reportes)
      .map(([rol]) => rol);

    expect(conReportes.length).toBeGreaterThan(0);
    expect(conReportes).toContain('ADMIN');
  });

  it('el cliente ya no codifica un rol a mano', () => {
    const fuente = readFileSync(join(RAIZ, 'src/app/(dashboard)/reportes/page.tsx'), 'utf8');

    expect(fuente).not.toMatch(/role\s*!==\s*['"]MEDICO['"]/);
    expect(fuente).toContain('puedeUsarModulo');
  });

  it('el servidor comprueba el permiso, no solo el cliente', () => {
    // Arreglar únicamente el cliente habría repetido el error que se acaba de
    // cerrar: una comprobación en el navegador no protege nada.
    const fuente = readFileSync(join(RAIZ, 'src/lib/actions/reports.actions.ts'), 'utf8');

    expect(fuente).toMatch(/puedeUsarModulo\(\s*session\.user\s*,\s*'reportes'\s*\)/);
  });
});
