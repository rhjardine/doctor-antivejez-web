'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, TrendingUp } from 'lucide-react';
import { FaHeartbeat, FaUserPlus, FaVial } from 'react-icons/fa';
import { getDashboardStats } from '@/lib/actions/biophysics.actions';
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
  Legend
} from 'recharts';
import { toast } from 'sonner';

// --- Tipos de Datos para el Dashboard ---
interface DashboardData {
  totalPatients: number;
  newPatientsLastMonth: number;
  avgBiologicalAge: number;
  rejuvenatedCount: number;
  patientStatusData: { name: string; value: number }[];
  monthlyPatientData: { month: string; pacientes: number }[];
  recentActivity: { type: string; text: string; date: Date }[];
}

const initialData: DashboardData = {
  totalPatients: 0,
  newPatientsLastMonth: 0,
  avgBiologicalAge: 0,
  rejuvenatedCount: 0,
  patientStatusData: [],
  monthlyPatientData: [],
  recentActivity: [],
};

// --- Componente Principal del Dashboard ---
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const result = await getDashboardStats();
        if (result.success && result.stats) {
          setData(result.stats as DashboardData);
        } else {
          toast.error(result.error || 'No se pudieron cargar los datos del dashboard.');
        }
      } catch (error) {
        console.error('Error cargando estadísticas:', error);
        toast.error('Error de conexión al cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);
  
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
    return `Hace ${Math.floor(seconds)} segundos`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al Sistema Doctor AntiVejez</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Pacientes Totales</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{data.totalPatients}</p>
            </div>
            <Users className="text-4xl text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Nuevos (Último Mes)</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{data.newPatientsLastMonth}</p>
            </div>
            <UserPlus className="text-4xl text-green-500 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Edad Biológica Promedio</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{data.avgBiologicalAge} años</p>
            </div>
            <FaHeartbeat className="text-4xl text-purple-500 opacity-50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium">Pacientes Rejuvenecidos</p>
              <p className="text-3xl font-bold text-cyan-900 mt-1">{data.rejuvenatedCount}</p>
            </div>
            <TrendingUp className="text-4xl text-cyan-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Pacientes (Últimos 6 meses)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyPatientData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pacientes" name="Nuevos Pacientes" stroke="rgb(35, 188, 239)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Estado de Pacientes</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.patientStatusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
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

      {/* Recent Activity */}
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
  );
}
