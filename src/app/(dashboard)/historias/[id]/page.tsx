'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getPatientWithTests } from '@/lib/actions/patients.actions';
import { toast } from 'sonner';
import { FaUser, FaHeartbeat, FaBook, FaAppleAlt, FaArrowLeft } from 'react-icons/fa';
import EdadBiologicaMain from '@/components/biophysics/edad-biologica-main';
import EdadBiofisicaTestView from '@/components/biophysics/edad-biofisica-test-view';
// CAMBIO 1: Importar el tipo correcto que incluye las relaciones
import type { PatientWithDetails } from '@/types';

// Usaremos PatientWithDetails como nuestro tipo principal en este componente
type Patient = PatientWithDetails;

export default function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id as string;

  // CAMBIO 2: El estado ahora usa el tipo correcto 'Patient' (alias de PatientWithDetails)
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'historia' | 'biofisica' | 'guia' | 'alimentacion'>('historia');
  const [showBiofisicaTest, setShowBiofisicaTest] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'biofisica') {
      setActiveTab('biofisica');
    }
  }, [searchParams]);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId]);

  const loadPatient = async () => {
    setLoading(true);
    try {
      const result = await getPatientWithTests(patientId);
      if (result.success && result.patient) {
        // CAMBIO 3: Aseguramos a TypeScript que los datos que llegan tienen la forma correcta
        setPatient(result.patient as Patient);
      } else {
        toast.error('Paciente no encontrado');
        router.push('/historias');
      }
    } catch (error) {
      toast.error('Error al cargar paciente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Paciente no encontrado. Redirigiendo...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'historia', label: 'Historia Médica', icon: FaUser },
    { id: 'biofisica', label: 'Edad Biológica', icon: FaHeartbeat },
    { id: 'guia', label: 'Guía del Paciente', icon: FaBook },
    { id: 'alimentacion', label: 'Alimentación Nutrigenómica', icon: FaAppleAlt },
  ];

  // ===============================================================
  // INICIO DEL CÓDIGO VISUAL (JSX) - 100% PRESERVADO Y MEJORADO
  // ===============================================================
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Patient Header */}
      <div className="card bg-gradient-to-r from-primary/5 to-primary-dark/5">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-primary">
              {patient.firstName[0]}{patient.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <button
                onClick={() => router.push('/historias')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary transition-colors shadow-sm"
              >
                <FaArrowLeft />
                <span>Volver a Pacientes</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <p className="font-medium">{patient.identification}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Edad</p>
                <p className="font-medium">{patient.chronologicalAge} años</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Género</p>
                <p className="font-medium">{patient.gender.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Único</p>
                <p className="font-medium text-xs break-all">{patient.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'historia' | 'biofisica' | 'guia' | 'alimentacion');
                  setShowBiofisicaTest(false);
                }}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="text-lg" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'historia' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Detalles de la Historia Médica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información Personal</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Identificación</dt>
                    <dd className="font-medium text-gray-700">{patient.identification}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Nacionalidad</dt>
                    <dd className="font-medium text-gray-700">{patient.nationality}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Lugar de Nacimiento</dt>
                    <dd className="font-medium text-gray-700">{patient.birthPlace}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Estado Civil</dt>
                    <dd className="font-medium text-gray-700">{patient.maritalStatus}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Profesión</dt>
                    <dd className="font-medium text-gray-700">{patient.profession}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información de Contacto</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Teléfono</dt>
                    <dd className="font-medium text-gray-700">{patient.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Email</dt>
                    <dd className="font-medium text-gray-700">{patient.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Dirección</dt>
                    <dd className="font-medium text-gray-700">{patient.address}, {patient.city}, {patient.state}, {patient.country}</dd>
                  </div>
                </dl>
              </div>

              <div className="md:col-span-2 pt-4">
                <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información Médica</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Grupo Sanguíneo</dt>
                    <dd className="font-medium text-gray-700">{patient.bloodType}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">Edad Cronológica</dt>
                    <dd className="font-medium text-gray-700">{patient.chronologicalAge} años</dd>
                  </div>
                </dl>
                {patient.observations && (
                  <div className="mt-4">
                    <dt className="text-sm text-gray-500 mb-1">Observaciones</dt>
                    <dd className="text-gray-700 bg-gray-50 p-3 rounded-md border">{patient.observations}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'biofisica' && (
          showBiofisicaTest ? (
            <EdadBiofisicaTestView
              patient={patient}
              onBack={() => setShowBiofisicaTest(false)}
              onTestComplete={loadPatient}
            />
          ) : (
            <EdadBiologicaMain
              patient={patient}
              onTestClick={() => setShowBiofisicaTest(true)}
            />
          )
        )}

        {activeTab === 'guia' && (
          <div className="card text-center py-12">
            <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Próximamente</h3>
            <p className="text-gray-500">La guía del paciente estará disponible pronto</p>
          </div>
        )}

        {activeTab === 'alimentacion' && (
          <div className="card text-center py-12">
            <FaAppleAlt className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Próximamente</h3>
            <p className="text-gray-500">El plan de alimentación nutrigenómica estará disponible pronto</p>
          </div>
        )}
      </div>
    </div>
  );
}