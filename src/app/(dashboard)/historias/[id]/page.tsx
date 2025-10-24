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
  FaEdit
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

// ✅ PASO 1: Importar el nuevo formulario unificado
import PatientForm from '@/components/patients/PatientForm';

// ❌ PASO 2: Eliminar la importación del formulario antiguo
// import PatientEditForm from '@/components/patients/PatientEditForm';


type TabId = 'resumen' | 'historia' | 'biofisica' | 'guia' | 'alimentacion' | 'omicas' | 'seguimiento';
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
    setGuideView('form');
    setGuideToLoad(null);
    router.push(`/historias/${patientId}?tab=${tabId}`, { scroll: false });
  }

  const renderBiofisicaContent = () => {
    // ... (Esta función no necesita cambios)
    switch (activeTestView) {
      case 'main':
        return (
          <EdadBiologicaMain 
            patient={patient} 
            onTestClick={() => setActiveTestView('biofisica')} 
            onBiochemistryTestClick={() => setActiveTestView('bioquimica')}
            onOrthomolecularTestClick={() => setActiveTestView('orthomolecular')}
            onHistoryClick={() => setActiveTestView('biofisica_history')}
            onBiochemistryHistoryClick={() => setActiveTestView('bioquimica_history')}
            onGeneticTestClick={() => setActiveTestView('genetica')}
          />
        );
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
      {/* Header del Paciente (sin cambios) */}
      <div className="card bg-gradient-to-r from-primary/5 to-primary-dark/5">
        {/* ... (código del header existente) ... */}
      </div>

      {/* Navegación de Pestañas (sin cambios) */}
      <div className="border-b border-gray-200">
        {/* ... (código de las pestañas existente) ... */}
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
        
        {/* ✅ PASO 3: Refactorizar la pestaña 'historia' */}
        {activeTab === 'historia' && (
          isEditing ? (
            // Si está en modo edición, renderiza el nuevo formulario unificado
            // pasándole el paciente actual y la función de callback.
            <PatientForm 
              patient={patient} 
              onSaveSuccess={handleUpdateSuccess} 
            />
          ) : (
            // Si no está en modo edición, muestra la vista de solo lectura (sin cambios)
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
              {/* ... (el resto del JSX de la vista de solo lectura permanece igual) ... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* ... */}
              </div>
            </div>
          )
        )}
        
        {activeTab === 'biofisica' && renderBiofisicaContent()}

        {activeTab === 'guia' && (
          // ... (código de la pestaña guía sin cambios) ...
        )}

        {activeTab === 'alimentacion' && <NutrigenomicGuide patient={patient} />}
        
        {activeTab === 'omicas' && <div className="card text-center py-12">{/* ... */}</div>}
        {active-tab === 'seguimiento' && <div className="card text-center py-12">{/* ... */}</div>}
      </div>
    </div>
  );
}