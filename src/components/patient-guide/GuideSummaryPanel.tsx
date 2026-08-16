'use client';

/**
 * GuideSummaryPanel — Panel "Guía en curso" (Hito G1)
 * ============================================================================
 *
 * Resuelve la ceguera de selección: con ~100 ítems repartidos en 9 acordeones,
 * el médico no podía ver de un vistazo qué llevaba prescrito. El folleto de
 * papel sí lo permite, porque todas las marcas están a la vista.
 *
 * El panel muestra en todo momento el total, el desglose por sección y la
 * dosis de cada ítem, con salto directo al campo correspondiente.
 */

import React from 'react';
import { FaTimes, FaClipboardList } from 'react-icons/fa';
import type { GuideSummary } from './guide-summary';

interface GuideSummaryPanelProps {
  summary: GuideSummary;
  /** Salta al ítem en el formulario (abre su sección y hace scroll). */
  onJumpToItem: (categoryId: string, itemId: string) => void;
  /** Quita la selección del ítem. */
  onRemoveItem: (itemId: string) => void;
}

export default function GuideSummaryPanel({
  summary,
  onJumpToItem,
  onRemoveItem,
}: GuideSummaryPanelProps) {
  const conSelecciones = summary.categories.filter((c) => c.count > 0);
  const vacia = summary.total === 0;

  return (
    <aside
      aria-labelledby="guia-en-curso-titulo"
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden xl:sticky xl:top-6"
    >
      {/* Cabecera */}
      <div className="bg-primary-dark text-white px-4 py-3 flex items-center justify-between gap-3">
        <h3 id="guia-en-curso-titulo" className="font-semibold flex items-center gap-2">
          <FaClipboardList aria-hidden="true" />
          Guía en curso
        </h3>
        <span
          aria-live="polite"
          aria-atomic="true"
          className="bg-white/20 rounded-full px-3 py-0.5 text-sm font-bold tabular-nums"
        >
          <span className="sr-only">Total de ítems prescritos: </span>
          {summary.total}
        </span>
      </div>

      {/* Contenido */}
      <div className="max-h-[60vh] overflow-y-auto">
        {vacia ? (
          <p className="px-4 py-8 text-sm text-gray-500 text-center">
            Aún no has seleccionado ningún ítem.
            <br />
            Lo que marques aparecerá aquí.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {conSelecciones.map((category) => (
              <li key={category.id}>
                <div className="px-4 py-2 bg-gray-50 flex items-center justify-between gap-2 sticky top-0">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-gray-600">
                    {category.title}
                  </h4>
                  <span className="text-xs font-bold text-primary tabular-nums">
                    {category.count}
                  </span>
                </div>

                <ul>
                  {category.items.map((item) => (
                    <li
                      key={item.id}
                      className="group flex items-start gap-2 px-4 py-2 hover:bg-gray-50"
                    >
                      <button
                        type="button"
                        onClick={() => onJumpToItem(category.id, item.id)}
                        className="flex-1 text-left min-w-0"
                        title="Ir a este ítem en el formulario"
                      >
                        <span className="block text-sm text-gray-800 truncate">
                          {item.name}
                        </span>
                        {item.detail ? (
                          <span className="block text-xs text-gray-500 truncate">
                            {item.detail}
                          </span>
                        ) : (
                          <span className="block text-xs text-amber-600 italic">
                            Sin dosis indicada
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Quitar ${item.name} de la guía`}
                        title="Quitar de la guía"
                        className="mt-0.5 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 focus:opacity-100 group-hover:text-gray-400 transition-colors"
                      >
                        <FaTimes size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
