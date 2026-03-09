'use client';

import { useState } from 'react';

interface GuideItem {
    id: string;
    category: string;
    title: string;
    dosage?: string | null;
    timing?: string | null;
    notes?: string | null;
    observacion?: string | null;
}

interface GuiaModalProps {
    guia: {
        items: GuideItem[];
        createdAt: Date | string;
    } | null;
}

export function GuiaModal({ guia }: GuiaModalProps) {
    const [open, setOpen] = useState(false);

    if (!guia || guia.items.length === 0) return null;

    // Agrupar items por categoría
    const itemsByCategory = guia.items.reduce((acc, item) => {
        const cat = item.category || 'General';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
    }, {} as Record<string, GuideItem[]>);

    return (
        <>
            {/* Botón de apertura — añadir junto al título "TRATAMIENTO ACTUAL" */}
            <button
                onClick={() => setOpen(true)}
                className="text-[10px] text-teal-600 font-bold hover:text-teal-800 
                   transition-colors uppercase tracking-wider bg-teal-50 px-3 py-1.5 rounded-full"
            >
                Ver Guía Completa
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Panel */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl 
                          max-h-[85vh] overflow-hidden flex flex-col">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 
                            border-b border-gray-100 bg-gradient-to-r from-teal-50 to-blue-50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Guía del Paciente</h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Actualizada: {new Date(guia.createdAt).toLocaleDateString('es-ES', {
                                        day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full 
                           text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xl"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Contenido scrollable */}
                        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5 custom-scrollbar-tabs">
                            {Object.entries(itemsByCategory).map(([category, items]) => (
                                <div key={category}>
                                    {/* Cabecera de categoría */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="h-px flex-1 bg-gray-100" />
                                        <span className="text-xs font-bold text-teal-700 uppercase tracking-widest px-2">
                                            {category}
                                        </span>
                                        <div className="h-px flex-1 bg-gray-100" />
                                    </div>

                                    {/* Items de la categoría */}
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.id}
                                                className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                                                    {item.timing && (
                                                        <span className="text-[10px] bg-teal-100 text-teal-700 
                                           px-2 py-0.5 rounded-full whitespace-nowrap font-bold tracking-wider uppercase">
                                                            {item.timing}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.dosage && (
                                                    <p className="text-xs text-blue-600 font-semibold mt-1">
                                                        💊 Dosis: {item.dosage}
                                                    </p>
                                                )}
                                                {item.notes && (
                                                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                        📋 {item.notes}
                                                    </p>
                                                )}
                                                {item.observacion && (
                                                    <div className="mt-2 bg-amber-50 border border-amber-100 
                                          rounded-lg px-3 py-2">
                                                        <p className="text-xs text-amber-800 leading-relaxed">
                                                            ⚠️ <span className="font-bold">Observación:</span> {item.observacion}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-center">
                            <p className="text-xs font-medium text-gray-400">
                                {guia.items.length} indicaciones en {Object.keys(itemsByCategory).length} categorías
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
