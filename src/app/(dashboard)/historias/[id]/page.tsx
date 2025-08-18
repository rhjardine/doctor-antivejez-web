'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getPatientDetails } from '@/lib/actions/patients.actions';
import { toast } from 'sonner';
import { 
  FaUser, 
  FaHeartbeat, 
  FaBook, 
  FaAppleAlt, 
  FaArrowLeft, 
  FaDna,
  FaChartLine,
  FaFileMedicalAlt,
  FaHistory,
  FaEdit,
  FaAtom // ===== NUEVO: Icono para Ortomolecular =====
} from 'react-icons/fa';
import EdadBiologicaMain from '@/components/biophysics/edad-biologica-main';
import EdadBiofisicaTestView from '@/components/biophysics/edad-biofisica-test-view';
import BiophysicsHistoryView from '@/components/biophysics/biophysics-history-view';
import PatientEditForm from '@/components/patients/PatientEditForm';
import PatientGuide from '@/components/patient-guide/PatientGuide';
import ClinicalSummary from '@/components/patients/ClinicalSummary';
import EdadBioquimicaTestView from '@/components/biochemistry/EdadBioquimicaTestView';
import BiochemistryHistoryView from '@/components/biochemistry/BiochemistryHistoryView';
import GeneticTestView from '@/components/genetics/GeneticTestView';
// ===== NUEVO: Importar el componente del Test Ortomolecular =====
import OrthomolecularTestView from '@/components/orthomolecular/OrthomolecularTestView';
// ===============================================================
import { telotestReportData } from '@/lib/mock-data';
import type { PatientWithDetails } from '@/types';

type Patient = PatientWithDetails;
type TabId = 'resumen' | 'historia' | 'biofisica' | 'guia' | 'alimentacion' | 'omicas' | 'seguimiento';
// ===== MODIFICADO: Se añade 'orthomolecular' a los tipos de vistas de test =====
type ActiveTestView = 'main' | 'biofisica' | 'bioquimica' | 'orthomolecular' | 'biofisica_history' | 'bioquimica_history' | 'genetica';
// ==============================================================================

export default function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [activeTestView, setActiveTestView] = useState<ActiveTestView>('main');
  const [isEditing, setIsEditing] = useState(false);

  const refreshPatientData = useCallback(async () => {
    if (!patientId) return;
    try {
      const result = await getPatientDetails(patientId);
      if (result.success && result.patient) {
        setPatient(result.patient as Patient);
      } else {
        toast.error('No se pudo refrescar la información del paciente.');
      }
    } catch (error) {
      toast.error('Error al refrescar los datos del paciente.');
    }
  }, [patientId]);

  const loadPatient = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const result = await getPatientDetails(patientId);
      if (result.success && result.patient) {
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
  }, [patientId, router]);
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    const view = searchParams.get('view');
    if (tab) {
      setActiveTab(tab as TabId);
    }
    if (tab === 'biofisica' && view === 'history') {
      setActiveTestView('biofisica_history');
    }
  }, [searchParams]);

  useEffect(() => {
    if (patientId) {
      loadPatient();
    }
  }, [patientId, loadPatient]);

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    refreshPatientData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  if (!patient) {
    return <div className="text-center py-12"><p className="text-gray-500">Paciente no encontrado. Redirigiendo...</p></div>;
  }

  const tabs = [
    { id: 'resumen', label: 'Resumen Clínico', icon: FaFileMedicalAlt },
    { id: 'historia', label: 'Historia Médica', icon: FaUser },
    { id: 'biofisica', label: 'Edad Biológica', icon: FaHeartbeat },
    { id: 'guia', label: 'Guía del Paciente', icon: FaBook },
    { id: 'alimentacion', label: 'Alimentación Nutrigenómica', icon: FaAppleAlt },
    { id: 'omicas', label: 'Programa OMICS', icon: FaDna },
    { id: 'seguimiento', label: 'Seguimiento', icon: FaChartLine },
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setActiveTestView('main');
    router.push(`/historias/${patientId}?tab=${tabId}`, { scroll: false });
  }

  const renderBiofisicaContent = () => {
    switch (activeTestView) {
      case 'main':
        return (
          <EdadBiologicaMain 
            patient={patient} 
            onTestClick={() => setActiveTestView('biofisica')} 
            onBiochemistryTestClick={() => setActiveTestView('bioquimica')}
            // ===== NUEVO: Se añade el handler para el clic en la tarjeta ortomolecular =====
            onOrthomolecularTestClick={() => setActiveTestView('orthomolecular')}
            // ==============================================================================
            onHistoryClick={() => setActiveTestView('biofisica_history')}
            onBiochemistryHistoryClick={() => setActiveTestView('bioquimica_history')}
            onGeneticTestClick={() => setActiveTestView('genetica')}
          />
        );
      case 'biofisica':
        return <EdadBiofisicaTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'bioquimica':
        return <EdadBioquimicaTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      // ===== NUEVO: Se añade el caso para renderizar la vista del Test Ortomolecular =====
      case 'orthomolecular':
        return <OrthomolecularTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      // =================================================================================
      case 'biofisica_history':
        return <BiophysicsHistoryView patient={patient} onBack={() => setActiveTestView('main')} onHistoryChange={refreshPatientData} />;
      case 'bioquimica_history':
        return <BiochemistryHistoryView patient={patient} onBack={() => setActiveTestView('main')} onHistoryChange={refreshPatientData} />;
      case 'genetica':
        return <GeneticTestView report={telotestReportData} onBack={() => setActiveTestView('main')} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header del Paciente */}
      <div className="card bg-gradient-to-r from-primary/5 to-primary-dark/5">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-primary">{patient.firstName[0]}{patient.lastName[0]}</span>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
              <button onClick={() => router.push('/historias')} className="flex items-center space-x-2 px-4 py-2 text-primary bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors shadow-sm">
                <FaArrowLeft />
                <span>Volver a Pacientes</span>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-gray-500">ID</p><p className="font-medium">{patient.identification}</p></div>
              <div><p className="text-sm text-gray-500">Edad</p><p className="font-medium">{patient.chronologicalAge} años</p></div>
              <div><p className="text-sm text-gray-500">Género</p><p className="font-medium">{patient.gender.replace(/_/g, ' ')}</p></div>
              <div><p className="text-sm text-gray-500">ID Único</p><p className="font-medium text-xs break-all">{patient.id}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegación de Pestañas */}
      <div className="border-b border-gray-200">
        <div className="overflow-x-auto pb-2 custom-scrollbar-tabs">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as TabId)}
                className={`flex-shrink-0 flex items-center space-x-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-md'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
                }`}
              >
                <tab.icon className="text-base" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido de las Pestañas */}
      <div className="min-h-[400px] mt-6">
        {activeTab === 'resumen' && (
            <ClinicalSummary 
                patient={patient} 
                onNavigateToTab={handleTabClick}
                onReloadPatient={refreshPatientData}
            />
        )}
        
        {activeTab === 'historia' && (
          isEditing ? (
            <PatientEditForm 
              patient={patient} 
              onUpdate={handleUpdateSuccess} 
              onCancel={() => setIsEditing(false)} 
            />
          ) : (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Detalles de la Historia Médica</h2>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <FaEdit />
                  <span>Editar Historia</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información Personal</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Identificación</dt><dd className="font-medium text-gray-700">{patient.identification}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Nacionalidad</dt><dd className="font-medium text-gray-700">{patient.nationality}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Lugar de Nacimiento</dt><dd className="font-medium text-gray-700">{patient.birthPlace}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Estado Civil</dt><dd className="font-medium text-gray-700">{patient.maritalStatus}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Profesión</dt><dd className="font-medium text-gray-700">{patient.profession}</dd></div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información de Contacto</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Teléfono</dt><dd className="font-medium text-gray-700">{patient.phone}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Email</dt><dd className="font-medium text-gray-700">{patient.email}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Dirección</dt><dd className="font-medium text-gray-700 text-right">{patient.address}, {patient.city}, {patient.state}, {patient.country}</dd></div>
                  </dl>
                </div>
                <div className="md:col-span-2 pt-4">
                  <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Información Médica</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Grupo Sanguíneo</dt><dd className="font-medium text-gray-700">{patient.bloodType}</dd></div>
                    <div className="flex justify-between"><dt className="text-sm text-gray-500">Edad Cronológica</dt><dd className="font-medium text-gray-700">{patient.chronologicalAge} años</dd></div>
                  </dl>
                  {patient.observations && (<div className="mt-4"><dt className="text-sm text-gray-500 mb-1">Observaciones</dt><dd className="text-gray-700 bg-gray-50 p-3 rounded-md border">{patient.observations}</dd></div>)}
                </div>
              </div>
            </div>
          )
        )}
        
        {activeTab === 'biofisica' && renderBiofisicaContent()}

        {activeTab === 'guia' && (
          <PatientGuide patient={patient} />
        )}

        {activeTab === 'alimentacion' && <div className="card text-center py-12"><FaAppleAlt className="text-6xl text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">Alimentación Nutrigenómica</h3><p className="text-gray-500">El plan de alimentación nutrigenómica estará disponible pronto.</p></div>}
        {activeTab === 'omicas' && <div className="card text-center py-12"><FaDna className="text-6xl text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">Programa OMICS</h3><p className="text-gray-500">La integración con estudios genómicos, proteómicos y metabolómicos estará disponible pronto.</p></div>}
        {activeTab === 'seguimiento' && <div className="card text-center py-12"><FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">Seguimiento</h3><p className="text-gray-500">Esta sección para monitorizar la evolución y seguimiento del paciente está en desarrollo.</p></div>}
      </div>
    </div>
  );
}