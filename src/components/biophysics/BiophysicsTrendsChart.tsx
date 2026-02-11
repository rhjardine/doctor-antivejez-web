'use client';

import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPatientBiophysicsTrends } from '@/lib/actions/patients.actions'; // Ensure this matches export

interface TrendData {
    testDate: Date;
    chronologicalAge: number;
    biologicalAge: number;
}

interface BiophysicsTrendsChartProps {
    patientId: string;
}

export default function BiophysicsTrendsChart({ patientId }: BiophysicsTrendsChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            if (!patientId) return;
            setLoading(true);
            try {
                const result = await getPatientBiophysicsTrends(patientId);
                if (result.success && result.trends) {
                    const formattedData = result.trends.map((t: TrendData) => ({
                        date: format(new Date(t.testDate), 'dd/MM/yyyy', { locale: es }),
                        rawDate: new Date(t.testDate).getTime(), // For sorting if needed
                        'Edad Cronológica': t.chronologicalAge,
                        'Edad Biológica': t.biologicalAge,
                        // Gap for tooltip msg
                        gap: (t.chronologicalAge - t.biologicalAge).toFixed(1)
                    }));
                    setData(formattedData);
                }
            } catch (error) {
                console.error("Failed to fetch trends", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [patientId]);

    if (loading) {
        return <div className="h-96 flex items-center justify-center text-gray-400">Cargando tendencias...</div>;
    }

    if (data.length === 0) {
        return <div className="h-96 flex items-center justify-center text-gray-400">No hay suficientes datos para generar tendencias.</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-full"></span>
                Tendencias de Rejuvenecimiento
            </h3>

            <div className="h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorGap" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            stroke="#94a3b8"
                            tick={{ fill: '#64748b' }}
                            tickMargin={10}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: '#64748b' }}
                            label={{ value: 'Edad (Años)', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ padding: '2px 0' }}
                        />
                        <Legend verticalAlign="top" height={36} />

                        {/* 
               Trick for "Shaded Gap":
               Layer 1: Chronological Age Area (Gray/Background-ish)
               Layer 2: Biological Age Area (White/Masking) - This visualizes the gap IF Bio < Chrono.
               However, to make it look like a proper graph we'll rely on Lines for values 
               and a transparent Area for the Chronological one to give "volume".
            */}

                        <Area
                            type="monotone"
                            dataKey="Edad Cronológica"
                            stroke="#94a3b8"
                            fill="#f1f5f9"
                            fillOpacity={1}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                        />

                        <Area
                            type="monotone"
                            dataKey="Edad Biológica"
                            stroke="#0ea5e9" // Primary Blue
                            fill="#fff" // Masking the gray area below it to create the "Gap" effect
                            fillOpacity={1}
                            strokeWidth={3}
                        />

                        {/* Redraw lines on top for sharpness */}
                        <Line
                            type="monotone"
                            dataKey="Edad Cronológica"
                            stroke="#64748b"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ r: 4, fill: '#64748b' }}
                            activeDot={{ r: 6 }}
                        />

                        <Line
                            type="monotone"
                            dataKey="Edad Biológica"
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8 }}
                        />

                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Gap de Rejuvenecimiento Promedio</p>
                    {/* Simple logic for stat calculation */}
                    <p className="text-2xl font-black text-primary">
                        {data.length > 0
                            ? (data.reduce((acc, curr) => acc + (curr['Edad Cronológica'] - curr['Edad Biológica']), 0) / data.length).toFixed(1)
                            : '0.0'}
                        <span className="text-sm font-normal text-slate-400 ml-2">años</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Última Edad Biológica</p>
                    <p className="text-2xl font-black text-slate-800">
                        {data.length > 0 ? data[data.length - 1]['Edad Biológica'].toFixed(1) : '--'}
                        <span className="text-sm font-normal text-slate-400 ml-2">años</span>
                    </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500 mb-1">Rejuvenecimiento Total</p>
                    <p className="text-2xl font-black text-green-600">
                        {data.length > 0 ? (data[data.length - 1]['gap']) : '--'}
                        <span className="text-sm font-normal text-slate-400 ml-2">años ganados</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
