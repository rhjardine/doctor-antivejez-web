'use client';

import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { FaChartLine, FaUsers, FaArrowUp, FaVenusMars } from 'react-icons/fa';

interface SmartReportsProps {
    data: any;
}

export const SmartReports: React.FC<SmartReportsProps> = ({ data }) => {
    const GENDER_COLORS = ['#fb7185', '#23bcef', '#94a3b8']; // Rose-Pink, Cyan, Slate
    const TREND_COLORS = { new: '#23bcef', recurring: '#293b64' };

    if (!data) return null;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 1. Header Metrics - Bento Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricBox
                    label="Pacientes Totales"
                    value={data.totalPatients}
                    subValue={`+${data.growth}%`}
                    icon={<FaUsers />}
                    color="text-[#293b64]"
                    trend="up"
                />
                <MetricBox
                    label="Delta Bio-Age"
                    value={`-${data.avgDelta}`}
                    subValue="Años"
                    icon={<FaChartLine />}
                    color="text-emerald-500"
                />
                <MetricBox
                    label="Adherencia Omics"
                    value={`${data.avgAdherence}%`}
                    subValue="Consented"
                    icon={<FaChartLine />}
                    color="text-[#23bcef]"
                />
                <div className="bg-[#293b64] p-6 rounded-[2rem] shadow-xl text-white flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><FaChartLine size={60} /></div>
                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Crecimiento</h3>
                    <div className="text-3xl font-black">PROFESSIONAL</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase">Status: Optimal</p>
                </div>
            </div>

            {/* 2. Advanced Charts - Bento Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend AreaChart: New vs Recurring */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black text-[#293b64] uppercase tracking-tighter">Historial: Nuevos vs. Recurrentes</h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#23bcef]"></div><span className="text-[10px] font-bold text-slate-400">NUEVOS</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#293b64]"></div><span className="text-[10px] font-bold text-slate-400">RECURRENTES</span></div>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trendData}>
                                <defs>
                                    <linearGradient id="gradientNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TREND_COLORS.new} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={TREND_COLORS.new} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradientRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TREND_COLORS.recurring} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={TREND_COLORS.recurring} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="new" name="Nuevos" stroke={TREND_COLORS.new} fillOpacity={1} fill="url(#gradientNew)" strokeWidth={3} />
                                <Area type="monotone" dataKey="recurring" name="Recurrentes" stroke={TREND_COLORS.recurring} fillOpacity={1} fill="url(#gradientRec)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gender Doughnut Chart */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col items-center">
                    <div className="flex items-center gap-2 self-start mb-8">
                        <FaVenusMars className="text-[#293b64]" />
                        <h3 className="text-sm font-black text-[#293b64] uppercase tracking-tighter">Distribución por Género</h3>
                    </div>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.genderData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={10}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.genderData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-[#293b64]">{data.totalPatients}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
                        {data.genderData.map((entry: any, index: number) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GENDER_COLORS[index % GENDER_COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name}</span>
                                <span className="text-[10px] font-black text-[#293b64] ml-auto">{entry.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

function MetricBox({ label, value, subValue, icon, color, trend }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 group hover:border-[#23bcef]/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-[#23bcef]/10 group-hover:text-[#23bcef] transition-colors">
                    {icon}
                </div>
                {trend && (
                    <span className="bg-emerald-50 text-emerald-500 text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1">
                        <FaArrowUp size={8} /> {subValue}
                    </span>
                )}
            </div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</h3>
            <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black tracking-tighter ${color}`}>{value}</span>
                {!trend && <span className="text-xs font-bold text-slate-400 uppercase">{subValue}</span>}
            </div>
        </div>
    );
}
