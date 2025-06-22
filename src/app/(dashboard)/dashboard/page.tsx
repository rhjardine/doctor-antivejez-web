'use client';

import { useEffect, useState } from 'react';
import { Users, UserPlus, Heart, TrendingUp } from 'lucide-react';
import { FaHeartbeat } from 'react-icons/fa';
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
  Cell
} from 'recharts';

interface DashboardStats {
  totalPatients: number;
  newPatientsLastMonth: number;
  avgBiologicalAge: number;
  rejuvenatedCount: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    newPatientsLastMonth: 0,
    avgBiologicalAge: 0,
    rejuvenatedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await getDashboardStats();
      if (result.success) {
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Datos de ejemplo para los gráficos
  const monthlyData = [
    { month: 'Ene', pacientes: 12 },
    { month: 'Feb', pacientes: 19 },
    { month: 'Mar', pacientes: 15 },
    { month: 'Abr', pacientes: 25 },
    { month: 'May', pacientes: 22 },
    { month: 'Jun', pacientes: 30 },
  ];

  const ageDistribution = [
    { name: 'Rejuvenecidos', value: stats.rejuvenatedCount, color: 'rgb(22, 163, 74)' },
    { name: 'Normal', value: stats.totalPatients - stats.rejuvenatedCount, color: 'rgb(234, 179, 8)' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
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
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Pacientes Totales</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalPatients}</p>
            </div>
            <Users className="text-4xl text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Nuevos (Último Mes)</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.newPatientsLastMonth}</p>
            </div>
            <UserPlus className="text-4xl text-green-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Edad Biológica Promedio</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.avgBiologicalAge} años</p>
            </div>
            <FaHeartbeat className="text-4xl text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium">Pacientes Rejuvenecidos</p>
              <p className="text-3xl font-bold text-cyan-900 mt-1">{stats.rejuvenatedCount}</p>
            </div>
            <TrendingUp className="text-4xl text-cyan-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Pacientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="pacientes" 
                  stroke="rgb(35, 188, 239)" 
                  strokeWidth={2}
                  dot={{ fill: 'rgb(35, 188, 239)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pacientes</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Nuevo paciente registrado: Juan Pérez</span>
            </div>
            <span className="text-xs text-gray-400">Hace 2 horas</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Test biofísico completado: María García</span>
            </div>
            <span className="text-xs text-gray-400">Hace 5 horas</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Historia clínica actualizada: Carlos López</span>
            </div>
            <span className="text-xs text-gray-400">Hace 1 día</span>
          </div>
        </div>
      </div>
    </div>
  );
}
