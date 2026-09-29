import { describe, it, expect } from 'vitest';
import {
  marcaDeItemPersonalizado,
  extraerItemsPersonalizados,
  personalizadosSinNombre,
  PREFIJO_PERSONALIZADO,
} from './custom-items';

describe('productos añadidos a mano por el médico', () => {
  describe('el fallo que esto corrige', () => {
    // El nombre vivía sólo en el estado de React. Al recargar la guía volvían
    // las marcas pero no los nombres, y el producto no se pintaba: desaparecía
    // sin aviso. El médico podía llevar meses añadiendo productos creyendo que
    // quedaban guardados.

    it('el nombre viaja dentro de la selección, que es lo único que se persiste', () => {
      const marca = marcaDeItemPersonalizado('Magnesio bisglicinato', 'cat_nutra_complementarios');
      expect(marca).toEqual({
        nombrePersonalizado: 'Magnesio bisglicinato',
        categoriaPersonalizada: 'cat_nutra_complementarios',
      });
    });

    it('una guía guardada devuelve el producto con su nombre y su categoría', () => {
      const guardado = {
        new_cat_nutra_primarios_1758000000000: {
          selected: true,
          qty: '2',
          ...marcaDeItemPersonalizado('Colágeno marino', 'cat_nutra_primarios'),
        },
      };
      expect(extraerItemsPersonalizados(guardado)).toEqual([
        {
          id: 'new_cat_nutra_primarios_1758000000000',
          nombre: 'Colágeno marino',
          categoriaId: 'cat_nutra_primarios',
        },
      ]);
    });

    it('la categoría es un dato guardado, no deducida del identificador', () => {
      // Parsear `new_<categoria>_<timestamp>` funcionaría hoy, pero renombrar
      // una categoría rompería guías ya guardadas en silencio.
      const guardado = {
        new_cat_vieja_1: {
          selected: true,
          ...marcaDeItemPersonalizado('Producto', 'cat_nueva'),
        },
      };
      expect(extraerItemsPersonalizados(guardado)[0].categoriaId).toBe('cat_nueva');
    });
  });

  describe('qué NO se recupera', () => {
    it('los ítems del catálogo no se tocan', () => {
      expect(extraerItemsPersonalizados({ np_1: { selected: true } })).toEqual([]);
    });

    it('un new_ sin nombre se omite: inventarlo sería peor que no mostrarlo', () => {
      // Son guías anteriores a esta corrección: el nombre se perdió y no hay
      // forma honesta de recuperarlo.
      expect(extraerItemsPersonalizados({ new_cat_x_1: { selected: true } })).toEqual([]);
    });

    it('un nombre en blanco no cuenta como nombre', () => {
      expect(
        extraerItemsPersonalizados({
          new_cat_x_1: { selected: true, nombrePersonalizado: '   ', categoriaPersonalizada: 'cat_x' },
        })
      ).toEqual([]);
    });

    it('sin categoría tampoco se recupera: no se sabría dónde pintarlo', () => {
      expect(
        extraerItemsPersonalizados({
          new_cat_x_1: { selected: true, nombrePersonalizado: 'Algo' },
        })
      ).toEqual([]);
    });
  });

  describe('personalizadosSinNombre', () => {
    it('detecta los huérfanos de guías antiguas, para poder avisar', () => {
      const guardado = {
        new_cat_x_1: { selected: true },
        new_cat_x_2: { selected: true, ...marcaDeItemPersonalizado('Con nombre', 'cat_x') },
        np_1: { selected: true },
      };
      expect(personalizadosSinNombre(guardado)).toEqual(['new_cat_x_1']);
    });

    it('un huérfano sin marcar no se reporta: no se prescribió', () => {
      expect(personalizadosSinNombre({ new_cat_x_1: { qty: '2' } })).toEqual([]);
    });
  });

  describe('robustez', () => {
    it('no revienta con entradas ausentes o raras', () => {
      expect(extraerItemsPersonalizados(null)).toEqual([]);
      expect(extraerItemsPersonalizados(undefined)).toEqual([]);
      expect(extraerItemsPersonalizados({})).toEqual([]);
      expect(extraerItemsPersonalizados({ new_x: null as unknown as object })).toEqual([]);
      expect(personalizadosSinNombre(null)).toEqual([]);
    });

    it('el prefijo es el que genera el componente', () => {
      expect(`${PREFIJO_PERSONALIZADO}cat_x_123`.startsWith('new_')).toBe(true);
    });
  });
});
