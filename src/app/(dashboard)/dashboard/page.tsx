'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  TrendingUp,
  Star,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Activity,
  ArrowUpRight,
  Plus,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDashboardStats, TimeRange } from '@/lib/actions/dashboard.actions';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
  Label
} from 'recharts';
import { toast } from 'sonner';

// --- Types ---
interface DashboardData {
  totalPatients: number;
  newPatients: number;
  avgBiologicalAge: number;
  rejuvenatedCount: number;
  patientStatusData: { name: string; value: number }[];
  monthlyPatientData: { month: string; pacientes: number }[];
  recentActivity: { type: string; text: string; date: Date }[];
  engagementScores: { name: string; score: number }[];
}

const initialData: DashboardData = {
  totalPatients: 0,
  newPatients: 0,
  avgBiologicalAge: 0,
  rejuvenatedCount: 0,
  patientStatusData: [],
  monthlyPatientData: [],
  recentActivity: [],
  engagementScores: [],
};

const timeRangeOptions: { id: TimeRange; label: string }[] = [
  { id: 'daily', label: 'Hoy' },
  { id: 'weekly', label: 'Semana' },
  { id: 'monthly', label: 'Mes' },
  { id: 'quarterly', label: 'Trimestre' },
  { id: 'yearly', label: 'Año' },
  { id: 'all', label: 'Todo' },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('monthly');
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDashboardStats(selectedRange);
      if (result.success && result.stats) {
        setData(result.stats as unknown as DashboardData);
      } else {
        toast.error(result.error || 'Error al cargar datos');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444']; // emerald, amber, red

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `Hace unos segundos`;
    const intervals = [
      { l: 'año', s: 31536000 },
      { l: 'mes', s: 2592000 },
      { l: 'día', s: 86400 },
      { l: 'hora', s: 3600 },
      { l: 'minuto', s: 60 }
    ];
    for (const { l, s } of intervals) {
      const count = Math.floor(seconds / s);
      if (count >= 1) return `Hace ${count} ${l}${count > 1 ? (l === 'mes' ? 'es' : 's') : ''}`;
    }
    return 'Recientemente';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#23bcef] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Sincronizando Clínica...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 lg:p-8 space-y-8 font-sans">

      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[#293b64] tracking-tight">Portal Clínico</h1>
          <p className="text-slate-500 font-medium">Panel de control de longevidad avanzada</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {timeRangeOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setSelectedRange(option.id)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedRange === option.id
                  ? 'bg-white text-[#23bcef] shadow-sm scale-105'
                  : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>

          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isPrivacyMode
              ? 'bg-[#293b64] text-white'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
          >
            {isPrivacyMode ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            {isPrivacyMode ? 'Público' : 'Privacidad'}
          </button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 lg:grid-cols-4 gap-6"
      >

        {/* --- METRIC CARDS --- */}
        <MetricCard
          variants={itemVariants}
          label="Pacientes Totales"
          value={data.totalPatients}
          growth="+12% este mes"
          icon={<Users className="text-blue-500" size={20} />}
          iconBg="bg-blue-50"
        />
        <MetricCard
          variants={itemVariants}
          label="Nuevos Pacientes"
          value={data.newPatients}
          growth="+5% vs ayer"
          icon={<UserPlus className="text-emerald-500" size={20} />}
          iconBg="bg-emerald-50"
        />
        <MetricCard
          variants={itemVariants}
          label="Edad Biológica"
          value={`${data.avgBiologicalAge}a`}
          growth="-2.4 años promedio"
          icon={<Activity className="text-purple-500" size={20} />}
          iconBg="bg-purple-50"
        />
        <MetricCard
          variants={itemVariants}
          label="Rejuvenecidos"
          value={data.rejuvenatedCount}
          growth="Core KPI"
          icon={<TrendingUp className="text-white" size={20} />}
          iconBg="bg-[#23bcef]"
          isSpecial
        />

        {/* --- MAIN CHARTS (Bento Row 2) --- */}
        <motion.div variants={itemVariants} className="lg:col-span-3 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter">Evolución de Pacientes</h3>
              <p className="text-xs text-slate-400 font-bold">Flujo de ingresos histórico</p>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
              <ArrowUpRight size={14} />
              <span className="text-[10px] font-black">CRECIMIENTO CLÍNICO</span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyPatientData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#23bcef" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#23bcef" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <ReferenceLine x="Sep 25" stroke="#293b64" strokeDasharray="3 3">
                  <Label value="MIGRACIÓN INICIAL" position="top" fill="#293b64" fontSize={8} fontWeight={900} dy={-10} />
                </ReferenceLine>
                <Area
                  type="monotone"
                  dataKey="pacientes"
                  stroke="#23bcef"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorPacientes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* --- ACTIVITY FEED --- */}
        <motion.div variants={itemVariants} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter mb-6">Actividad</h3>
          <div className="space-y-6">
            {data.recentActivity.map((activity, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={`mt-1 h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${activity.type === 'new_patient' ? 'bg-emerald-50 text-emerald-500' : 'bg-cyan-50 text-cyan-500'}`}>
                  {activity.type === 'new_patient' ? <Plus size={16} /> : <Activity size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-bold text-slate-800 transition-all ${isPrivacyMode ? 'blur-md select-none' : ''}`}>
                    {activity.text}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    {timeSince(activity.date)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 border-2 border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-[#23bcef] hover:text-[#23bcef] transition-all">
            Ver Todo el Historial
          </button>
        </motion.div>

        {/* --- ENGAGEMENT CHART (Bento Row 3) --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <Star className="text-amber-400 fill-amber-400" size={20} />
            <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter">Compromiso del Paciente</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engagementScores} layout="vertical" margin={{ left: 0, right: 40 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tick={(props) => (
                    <g transform={`translate(${props.x},${props.y})`}>
                      <text
                        x={-10}
                        y={0}
                        dy={4}
                        textAnchor="end"
                        fill="#64748b"
                        fontSize={10}
                        fontWeight={700}
                        className={isPrivacyMode ? 'blur-md select-none' : ''}
                      >
                        {props.payload.value.split(' ')[0]}
                      </text>
                    </g>
                  )}
                />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Bar
                  dataKey="score"
                  fill="#23bcef"
                  radius={[0, 10, 10, 0]}
                  barSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* --- DISTRIBUTION CHART --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl relative">
          <h3 className="text-lg font-black text-[#293b64] uppercase tracking-tighter mb-4 text-center">Estado General</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.patientStatusData}
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
                <text x="50%" y="45%" textAnchor="middle" dominantBaseline="middle" className="fill-[#293b64] text-xs font-black uppercase">
                  Total
                </text>
                <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-[#23bcef] text-2xl font-black">
                  {data.totalPatients}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {data.patientStatusData.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter whitespace-nowrap">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function MetricCard({ label, value, growth, icon, iconBg, isSpecial, variants }: any) {
  return (
    <motion.div
      variants={variants}
      className={`p-6 rounded-[2rem] bg-white border border-slate-200 shadow-lg relative overflow-hidden group transition-all hover:-translate-y-1 ${isSpecial ? 'ring-2 ring-cyan-100 shadow-cyan-100 ring-offset-4 ring-offset-slate-50' : ''}`}
    >
      <div className={`p-3 rounded-2xl w-fit mb-6 transition-all group-hover:scale-110 ${iconBg} ${isSpecial ? 'shadow-[0_0_20px_rgba(35,188,239,0.5)]' : ''}`}>
        {icon}
      </div>

      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-4xl font-black text-[#293b64] tracking-tighter">{value}</h4>
        </div>
      </div>

      <div className={`mt-4 pt-4 border-t border-slate-50 flex items-center justify-between`}>
        <span className={`text-[10px] font-black uppercase tracking-widest ${isSpecial ? 'text-[#23bcef]' : 'text-emerald-500'}`}>
          {growth}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-100 group-hover:bg-[#23bcef] transition-colors"></div>
      </div>

      {isSpecial && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#23bcef]/5 rounded-full blur-3xl group-hover:bg-[#23bcef]/10 transition-colors"></div>
      )}
    </motion.div>
  );
}
