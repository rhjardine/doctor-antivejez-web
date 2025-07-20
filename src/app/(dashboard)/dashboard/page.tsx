'use client';

import { useEffect, useState, useCallback } from 'react';
import { Users, UserPlus, TrendingUp, Star } from 'lucide-react';
import { FaHeartbeat, FaUserPlus, FaVial } from 'react-icons/fa';
import { getDashboardStats, TimeRange } from '@/lib/actions/dashboard.actions.ts';
import { 
  LineChart, 
  Line, 
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
  Bar
} from 'recharts';
import { toast } from 'sonner';

// --- Tipos de Datos para el Dashboard ---
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
    { id: 'weekly', label: 'Esta Semana' },
    { id: 'monthly', label: 'Este Mes' },
    { id: 'quarterly', label: 'Este Trimestre' },
    { id: 'yearly', label: 'Este Año' },
    { id: 'all', label: 'Histórico' },
];

// --- Componente Principal del Dashboard ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('monthly');

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDashboardStats(selectedRange);
      if (result.success && result.stats) {
        setData(result.stats as unknown as DashboardData);
      } else {
        toast.error(result.error || 'No se pudieron cargar los datos del dashboard.');
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error de conexión al cargar el dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  const PIE_COLORS = ['rgb(22, 163, 74)', 'rgb(234, 179, 8)', 'rgb(220, 38, 38)'];

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `Hace ${Math.floor(interval)} años`;
    interval = seconds / 2592000;
    if (interval > 1) return `Hace ${Math.floor(interval)} meses`;
    interval = seconds / 86400;
    if (interval > 1) return `Hace ${Math.floor(interval)} días`;
    interval = seconds / 3600;
    if (interval > 1) return `Hace ${Math.floor(interval)} horas`;
    interval = seconds / 60;
    if (interval > 1) return `Hace ${Math.floor(interval)} minutos`;
    return `Hace unos segundos`;
  };

  const selectedRangeLabel = timeRangeOptions.find(opt => opt.id === selectedRange)?.label || 'Este Mes';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header y Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Bienvenido al Sistema Doctor AntiVejez</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {timeRangeOptions.map(option => (
                <button 
                    key={option.id}
                    onClick={() => setSelectedRange(option.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${selectedRange === option.id ? 'bg-white text-primary shadow' : 'text-gray-600 hover:bg-white/60'}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <p className="text-blue-600 text-sm font-medium">Pacientes Totales</p>
          <p className="text-3xl font-bold text-blue-900 mt-1">{data.totalPatients}</p>
        </div>
        <div className="stat-card">
          <p className="text-green-600 text-sm font-medium">Nuevos ({selectedRangeLabel})</p>
          <p className="text-3xl font-bold text-green-900 mt-1">{data.newPatients}</p>
        </div>
        <div className="stat-card">
          <p className="text-purple-600 text-sm font-medium">Edad Biológica Promedio</p>
          <p className="text-3xl font-bold text-purple-900 mt-1">{data.avgBiologicalAge} años</p>
        </div>
        <div className="stat-card">
          <p className="text-cyan-600 text-sm font-medium">Pacientes Rejuvenecidos</p>
          <p className="text-3xl font-bold text-cyan-900 mt-1">{data.rejuvenatedCount}</p>
        </div>
      </div>

      {/* Charts y Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Pacientes (Último Año)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyPatientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pacientes" name="Nuevos Pacientes" stroke="rgb(35, 188, 239)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-3">
            {data.recentActivity.length > 0 ? (
              data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'new_patient' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      {activity.type === 'new_patient' ? <FaUserPlus className="text-green-600" /> : <FaVial className="text-blue-600" />}
                    </div>
                    <span className="text-sm text-gray-600">{activity.text}</span>
                  </div>
                  <span className="text-xs text-gray-400">{timeSince(activity.date)}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay actividad reciente.</p>
            )}
          </div>
        </div>
      </div>

      {/* Fila de Innovación */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 - Compromiso de Pacientes (Últimos 90 días)</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.engagementScores} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={120} fontSize={12} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Bar dataKey="score" name="Puntuación de Compromiso" fill="rgb(99, 102, 241)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución General de Estado</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.patientStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {data.patientStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
