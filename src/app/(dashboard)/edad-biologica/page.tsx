'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllPatients } from '@/lib/actions/patients.actions';
import { toast } from 'sonner';
import {
  FaArrowLeft,
  FaEye,
  FaPlus,
  FaChartLine,
  FaUser,
  FaClock,
  FaCalendar
} from 'react-icons/fa';
import { formatDate } from '@/utils/date';

// Importa la interfaz Patient desde '@/types' si está definida globalmente
// Si no, asegúrate de que la interfaz aquí es completa con todos los campos necesarios.
// Dado que 'biophysicsTests' es parte de la interfaz Patient en '@/types/index.ts',
// deberíamos importar Patient desde allí para consistencia.
import type { Patient } from '@/types'; //

export default function EdadBiologicaPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar pacientes
  useEffect(() => {
    const loadPatients = async () => {
      try {
        const result = await getAllPatients();
        if (result.success) {
          // Filtrar solo pacientes con tests biofísicos
          // CORRECCIÓN: Añadir el tipo 'patient: Patient'
          const patientsWithTests = (result.patients || []).filter(
            (patient: Patient) => patient.biophysicsTests && patient.biophysicsTests.length > 0
          );
          setPatients(patientsWithTests);
        } else {
          toast.error(result.error || 'Error al cargar pacientes');
        }
      } catch (error) {
        console.error('Error loading patients:', error);
        toast.error('Error al cargar pacientes');
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, []);

  const getBiologicalAgeStatus = (chronologicalAge: number, biologicalAge: number) => {
    const difference = biologicalAge - chronologicalAge;
    if (difference < -2) return { status: 'excellent', color: 'green', text: 'Excelente' };
    if (difference < 0) return { status: 'good', color: 'blue', text: 'Bueno' };
    if (difference < 2) return { status: 'normal', color: 'yellow', text: 'Normal' };
    return { status: 'poor', color: 'red', text: 'Preocupante' };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header con botón "Ir Atrás" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/historias')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            title="Volver a Pacientes"
          >
            <FaArrowLeft className="text-lg" />
            <span className="hidden sm:inline">Volver a Pacientes</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edad Biológica</h1>
            <p className="text-gray-600 mt-1">
              Análisis y seguimiento de edad biológica de pacientes
            </p>
          </div>
        </div>
        <Link
          href="/historias"
          className="btn-primary flex items-center space-x-2"
        >
          <FaPlus />
          <span className="hidden sm:inline">Nuevo Test</span>
        </Link>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaUser className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pacientes con Test</p>
              <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaChartLine className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Edad Promedio Bio.</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.length > 0
                  ? Math.round(
                      patients.reduce((acc, p) => acc + (p.biophysicsTests?.[0]?.biologicalAge || 0), 0)
                      / patients.length
                    )
                  : 0} años
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FaClock className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Edad Promedio Cron.</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.length > 0
                  ? Math.round(
                      patients.reduce((acc, p) => acc + p.chronologicalAge, 0)
                      / patients.length
                    )
                  : 0} años
              </p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FaCalendar className="text-xl" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tests Realizados</p>
              <p className="text-2xl font-bold text-gray-900">
                {patients.reduce((acc, p) => acc + (p.biophysicsTests?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pacientes con edad biológica */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Pacientes con Análisis de Edad Biológica
          </h2>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-12">
            <FaChartLine className="mx-auto text-4xl text-gray-300 mb-4" />
            <div className="text-gray-400 text-lg mb-2">
              No hay pacientes con tests biofísicos realizados
            </div>
            <p className="text-gray-500 mb-6">
              Realiza el primer test de edad biológica para ver los resultados aquí
            </p>
            <Link
              href="/historias"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <FaPlus />
              <span>Realizar Primer Test</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => {
              const latestTest = patient.biophysicsTests?.[0]; // Usar optional chaining aquí
              // Asegurarse de que latestTest exista antes de acceder a sus propiedades
              const status = latestTest ? getBiologicalAgeStatus(
                patient.chronologicalAge,
                latestTest.biologicalAge
              ) : { status: 'unknown', color: 'gray', text: 'N/A' }; // Manejar caso sin test

              return (
                <div
                  key={patient.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200"
                >
                  {/* Información del paciente */}
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-medium text-primary">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: {patient.identification}
                      </p>
                    </div>
                  </div>

                  {/* Edades y estado */}
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Edad Cronológica:</span>
                      <span className="font-semibold">{patient.chronologicalAge} años</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Edad Biológica:</span>
                      <span className="font-semibold text-primary">
                        {latestTest ? `${Math.round(latestTest.biologicalAge)} años` : '--'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Diferencia:</span>
                      <span className={`font-semibold text-${status.color}-600`}>
                        {latestTest ? `${latestTest.differentialAge > 0 ? '+' : ''}${Math.round(latestTest.differentialAge)} años` : '--'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-${status.color}-100 text-${status.color}-800`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Último Test:</span>
                      <span className="text-sm text-gray-500">
                        {latestTest ? formatDate(latestTest.testDate) : '--'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/edad-biologica/${patient.id}`)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <FaEye />
                      <span>Ver Detalle</span>
                    </button>

                    <button
                      onClick={() => router.push(`/edad-biologica/${patient.id}/nuevo-test`)}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Nuevo Test"
                    >
                      <FaPlus />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}