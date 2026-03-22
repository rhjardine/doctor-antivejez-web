'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Users, ArrowRight, Check, TrendingUp, Star, AlertTriangle, XCircle } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
type Category = 'EXCELENTE' | 'BUENO' | 'REGULAR' | 'CRITICO' | null;

interface Lead {
    id?: string;
    email: string;
    name: string;
    score: number | null;
    category: Category;
    createdAt: string;
    converted: boolean;
    country?: string;
    phone?: string;
}

interface Stats {
    totalLeads: number;
    convertedLeads: number;
    avgScore: number;
    leadsByCountry: Record<string, number>;
    leadsByCategory: Record<string, number>;
    recentLeads: Lead[];
}

// ─── Category badge styling ──────────────────────────────────────────────────
const CAT_STYLE: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    EXCELENTE: { label: 'Excelente', className: 'bg-green-100 text-green-800', icon: <Star size={12} /> },
    BUENO: { label: 'Bueno', className: 'bg-blue-100 text-blue-800', icon: <TrendingUp size={12} /> },
    REGULAR: { label: 'Regular', className: 'bg-amber-100 text-amber-800', icon: <AlertTriangle size={12} /> },
    CRITICO: { label: 'Crítico', className: 'bg-red-100 text-red-800', icon: <XCircle size={12} /> },
};

function CategoryBadge({ cat }: { cat: Category }) {
    if (!cat) return <span className="text-xs text-gray-400 italic">Sin test</span>;
    const s = CAT_STYLE[cat];
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
            {s.icon} {s.label}
        </span>
    );
}

function StatusBadge({ converted }: { converted: boolean }) {
    if (converted) {
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800"><Check size={12} /> Convertido</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Nuevo</span>;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LeadsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterCat, setFilterCat] = useState<string>('ALL');
    const [contactedIds, setContactedIds] = useState<Set<string>>(new Set());

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/leads/stats');
            if (!res.ok) throw new Error('No autorizado o error en servidor');
            const data = await res.json();
            setStats(data);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Error al cargar estadísticas');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const markContacted = (email: string) => {
        setContactedIds(prev => new Set(Array.from(prev).concat(email)));
        // TODO: POST /api/leads/mark-contacted when endpoint is available
    };

    const handleConvert = (lead: Lead) => {
        const params = new URLSearchParams({
            email: lead.email,
            name: lead.name,
            phone: lead.phone ?? '',
            source: 'lead_conversion',
        });
        window.location.href = `/historias/nuevo?${params.toString()}`;
    };

    const filteredLeads = (stats?.recentLeads ?? []).filter(l =>
        filterCat === 'ALL' || l.category === filterCat
    );

    const conversionRate = stats && stats.totalLeads > 0
        ? Math.round((stats.convertedLeads / stats.totalLeads) * 100)
        : 0;

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-gray-500">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Cargando leads…</p>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] px-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-sm">
                    <XCircle className="mx-auto mb-3 text-red-500" size={32} />
                    <p className="font-semibold text-red-800 mb-1">Error al cargar</p>
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={fetchStats}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Users size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Leads Públicos</h1>
                    <p className="text-sm text-gray-500">Captaciones del funnel de longevidad</p>
                </div>
                <button onClick={fetchStats}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium underline underline-offset-2">
                    Actualizar
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
                {[
                    { label: 'Total Leads', value: stats?.totalLeads ?? 0, color: 'text-gray-900', bg: 'bg-gray-50' },
                    { label: 'Convertidos', value: stats?.convertedLeads ?? 0, color: 'text-green-700', bg: 'bg-green-50' },
                    { label: 'Tasa de Conversión', value: `${conversionRate}%`, color: 'text-blue-700', bg: 'bg-blue-50' },
                    { label: 'Score Promedio', value: stats?.avgScore ?? 0, color: 'text-purple-700', bg: 'bg-purple-50' },
                ].map(s => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100`}>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">{s.label}</p>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Category distribution */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
                {['EXCELENTE', 'BUENO', 'REGULAR', 'CRITICO'].map(cat => (
                    <div key={cat} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                        <CategoryBadge cat={cat as Category} />
                        <p className="text-2xl font-black text-gray-900 mt-2">
                            {stats?.leadsByCategory[cat] ?? 0}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-sm text-gray-500 font-medium">Filtrar:</span>
                {['ALL', 'EXCELENTE', 'BUENO', 'REGULAR', 'CRITICO'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCat(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${filterCat === cat
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                            }`}
                    >
                        {cat === 'ALL' ? 'Todos' : cat}
                    </button>
                ))}
            </div>

            {/* Leads table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filteredLeads.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Users size={40} className="mx-auto mb-3 opacity-40" />
                        <p className="font-medium">No hay leads con este filtro aún</p>
                        <p className="text-sm mt-1">Comparte /longevidad para empezar a captar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['Nombre', 'Email', 'Score', 'Categoría', 'País', 'Fecha', 'Estado', 'Acciones'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLeads.map((lead, i) => (
                                    <tr key={lead.email + i}
                                        className={`hover:bg-gray-50/60 transition-colors ${lead.converted ? 'opacity-70' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{lead.name}</td>
                                        <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                                        <td className="px-4 py-3">
                                            {lead.score !== null ? (
                                                <span className="font-bold text-gray-900">{lead.score}</span>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3"><CategoryBadge cat={lead.category} /></td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{lead.country ?? '—'}</td>
                                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                            {new Date(lead.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-4 py-3">
                                            {contactedIds.has(lead.email)
                                                ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><Check size={12} /> Contactado</span>
                                                : <StatusBadge converted={lead.converted} />
                                            }
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {!contactedIds.has(lead.email) && !lead.converted && (
                                                    <button
                                                        onClick={() => markContacted(lead.email)}
                                                        className="text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all font-medium whitespace-nowrap"
                                                    >
                                                        Marcar contactado
                                                    </button>
                                                )}
                                                {!lead.converted && (
                                                    <button
                                                        onClick={() => handleConvert(lead)}
                                                        className="text-xs px-2.5 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium flex items-center gap-1 whitespace-nowrap"
                                                    >
                                                        Convertir <ArrowRight size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Country distribution */}
            {stats && Object.keys(stats.leadsByCountry).length > 0 && (
                <div className="mt-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Distribución por País</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(stats.leadsByCountry)
                            .sort(([, a], [, b]) => b - a)
                            .map(([country, count]) => (
                                <div key={country} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                    <span className="text-sm font-medium text-gray-700">{country}</span>
                                    <span className="text-sm font-black text-blue-600">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
