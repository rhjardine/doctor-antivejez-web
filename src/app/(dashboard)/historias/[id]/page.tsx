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
  FaVial // ✅ Se añade el icono para la nueva pestaña
} from 'react-icons/fa';

// Componentes existentes
import EdadBiologicaMain from '@/components/biophysics/edad-biologica-main';
import EdadBiofisicaTestView from '@/components/biophysics/edad-biofisica-test-view';
import BiophysicsHistoryView from '@/components/biophysics/biophysics-history-view';
import PatientGuide from '@/components/patient-guide/PatientGuide';
import GuideHistoryView from '@/components/patient-guide/GuideHistoryView';
import ClinicalSummary from '@/components/patients/ClinicalSummary';
import EdadBioquimicaTestView from '@/components/biochemistry/EdadBioquimicaTestView';
import BiochemistryHistoryView from '@/components/biochemistry/BiochemistryHistoryView';
import GeneticTestView from '@/components/genetics/GeneticTestView';
import OrthomolecularTestView from '@/components/orthomolecular/OrthomolecularTestView';
import NutrigenomicGuide from '@/components/nutrition/NutrigenomicGuide';
import { telotestReportData } from '@/lib/mock-data';
import type { PatientWithDetails } from '@/types';
import { Button } from '@/components/ui/button';
import PatientForm from '@/components/patients/PatientForm';

// ✅ Se importa el nuevo componente para la pestaña de Biomarcadores
import NlrCalculator from '@/components/biomarkers/NlrCalculator';

// ✅ Se actualiza el tipo TabId
import { TabId } from '@/types';
type ActiveTestView = 'main' | 'biofisica' | 'bioquimica' | 'orthomolecular' | 'biofisica_history' | 'bioquimica_history' | 'genetica';
type GuideView = 'form' | 'history';

export default function PatientDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<PatientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('resumen');
  const [activeTestView, setActiveTestView] = useState<ActiveTestView>('main');
  const [isEditing, setIsEditing] = useState(false);
  const [guideView, setGuideView] = useState<GuideView>('form');
  const [guideToLoad, setGuideToLoad] = useState<string | null>(null);

  const refreshPatientData = useCallback(async () => {
    if (!patientId) return;
    try {
      const result = await getPatientDetails(patientId);
      if (result.success && result.patient) {
        setPatient(result.patient as PatientWithDetails);
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
        setPatient(result.patient as PatientWithDetails);
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
    if (tab) setActiveTab(tab as TabId);
    if (tab === 'biofisica' && view === 'history') setActiveTestView('biofisica_history');
  }, [searchParams]);

  useEffect(() => {
    if (patientId) loadPatient();
  }, [patientId, loadPatient]);

  const handleUpdateSuccess = () => {
    setIsEditing(false);
    refreshPatientData();
  };

  const handleViewGuide = (guideId: string) => {
    setGuideToLoad(guideId);
    setGuideView('form');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  if (!patient) {
    return <div className="text-center py-12"><p className="text-gray-500">Paciente no encontrado. Redirigiendo...</p></div>;
  }

  // ✅ Se actualiza el array de pestañas
  const tabs = [
    { id: 'resumen', label: 'Resumen Clínico', icon: FaFileMedicalAlt },
    { id: 'historia', label: 'Historia Médica', icon: FaUser },
    { id: 'biofisica', label: 'Edad Biológica', icon: FaHeartbeat },
    { id: 'biomarcadores', label: 'Biomarcadores', icon: FaVial },
    { id: 'guia', label: 'Guía del Paciente', icon: FaBook },
    { id: 'alimentacion', label: 'Alimentación Nutrigenómica', icon: FaAppleAlt },
    { id: 'omicas', label: 'Programa OMICS', icon: FaDna },
  ];

  const handleTabClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setActiveTestView('main');
    setGuideView('form');
    setGuideToLoad(null);
    router.push(`/historias/${patientId}?tab=${tabId}`, { scroll: false });
  }

  const renderBiofisicaContent = () => {
    switch (activeTestView) {
      case 'main':
        return <EdadBiologicaMain patient={patient} onTestClick={() => setActiveTestView('biofisica')} onBiochemistryTestClick={() => setActiveTestView('bioquimica')} onOrthomolecularTestClick={() => setActiveTestView('orthomolecular')} onHistoryClick={() => setActiveTestView('biofisica_history')} onBiochemistryHistoryClick={() => setActiveTestView('bioquimica_history')} onGeneticTestClick={() => setActiveTestView('genetica')} />;
      case 'biofisica':
        return <EdadBiofisicaTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'bioquimica':
        return <EdadBioquimicaTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'orthomolecular':
        return <OrthomolecularTestView patient={patient} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
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

      <div className="border-b border-gray-200">
        <div className="overflow-x-auto pb-2 custom-scrollbar-tabs">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as TabId)}
                className={`flex-shrink-0 flex items-center space-x-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${activeTab === tab.id
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
            <PatientForm
              patient={patient}
              onSaveSuccess={handleUpdateSuccess}
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

        {/* ✅ Se añade la lógica de renderizado para la nueva pestaña */}
        {activeTab === 'biomarcadores' && (
          <NlrCalculator patient={patient} />
        )}

        {activeTab === 'guia' && (
          <div className="space-y-4">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
              <Button size="sm" variant={guideView === 'form' ? 'default' : 'ghost'} onClick={() => { setGuideView('form'); setGuideToLoad(null); }}>
                <FaFileMedicalAlt className="mr-2" /> {guideToLoad ? 'Viendo Guía' : 'Nueva Guía'}
              </Button>
              <Button size="sm" variant={guideView === 'history' ? 'default' : 'ghost'} onClick={() => setGuideView('history')}>
                <FaHistory className="mr-2" /> Historial
              </Button>
            </div>
            {guideView === 'form' && (<PatientGuide key={guideToLoad || 'new'} patient={patient} guideIdToLoad={guideToLoad} />)}
            {guideView === 'history' && (<GuideHistoryView patientId={patient.id} onViewGuide={handleViewGuide} onBack={() => setGuideView('form')} />)}
          </div>
        )}

        {activeTab === 'alimentacion' && <NutrigenomicGuide patient={patient} />}

        {activeTab === 'omicas' && <div className="card text-center py-12"><FaDna className="text-6xl text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-700 mb-2">Programa OMICS</h3><p className="text-gray-500">La integración con estudios genómicos, proteómicos y metabolómicos estará disponible pronto.</p></div>}

        {/* La pestaña 'seguimiento' y su contenido han sido eliminados */}
      </div>
    </div>
  );
}