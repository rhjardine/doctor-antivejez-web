'use client';

import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
    Line
} from 'recharts';

interface EdadBiologicaChartProps {
    data: any[];
}

export default function EdadBiologicaChart({ data }: EdadBiologicaChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-60 flex items-center justify-center text-gray-400">No hay suficientes datos.</div>;
    }

    return (
        <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickMargin={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ padding: '2px 0' }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />

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
                        stroke="#0ea5e9"
                        fill="#fff"
                        fillOpacity={1}
                        strokeWidth={3}
                    />

                    <Line
                        type="monotone"
                        dataKey="Edad Cronológica"
                        stroke="#64748b"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3, fill: '#64748b' }}
                        activeDot={{ r: 5 }}
                    />

                    <Line
                        type="monotone"
                        dataKey="Edad Biológica"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
