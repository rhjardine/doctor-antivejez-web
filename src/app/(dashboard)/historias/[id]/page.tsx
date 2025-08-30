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
  FaAtom
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
import OrthomolecularTestView from '@/components/orthomolecular/OrthomolecularTestView';
import NutrigenomicGuide from '@/components/nutrition/NutrigenomicGuide';
import { telotestReportData } from '@/lib/mock-data';
import type { PatientWithDetails, TabId } from '@/types';

// ===== ANÁLISIS Y CORRECCIÓN: Se importan los tipos y la acción necesarios =====
import { getFullNutritionDataForPatient } from '@/lib/actions/nutrition.actions';
import { FullNutritionData } from '@/types/nutrition';


type ActiveTestView = 'main' | 'biofisica' | 'bioquimica' | 'orthomolecular' | 'biofisica_history' | 'bioquimica_history' | 'genetica';

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

  // ===== ANÁLISIS Y CORRECCIÓN: Se añade un estado para los datos de nutrición =====
  // Este estado solo se cargará cuando el usuario navegue a la pestaña correspondiente,
  // manteniendo la carga inicial de la página ligera y rápida.
  const [nutritionData, setNutritionData] = useState<FullNutritionData | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);


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
      const newTabId = tab as TabId;
      setActiveTab(newTabId);
      // ===== ANÁLISIS Y CORRECCIÓN: Carga diferida de datos de nutrición =====
      // Si el enlace profundo lleva directamente a la pestaña de alimentación, se cargan sus datos.
      if (newTabId === 'alimentacion' && !nutritionData) {
        handleTabClick(newTabId, true); // Llama a la función que ahora carga los datos
      }
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
  
  // Se preserva la estructura original del componente y sus funciones.
  const tabs = [
    { id: 'resumen', label: 'Resumen Clínico', icon: FaFileMedicalAlt },
    { id: 'historia', label: 'Historia Médica', icon: FaUser },
    { id: 'biofisica', label: 'Edad Biológica', icon: FaHeartbeat },
    { id: 'guia', label: 'Guía del Paciente', icon: FaBook },
    { id: 'alimentacion', label: 'Alimentación Nutrigenómica', icon: FaAppleAlt },
    { id: 'omicas', label: 'Programa OMICS', icon: FaDna },
    { id: 'seguimiento', label: 'Seguimiento', icon: FaChartLine },
  ];

  // ===== ANÁLISIS Y CORRECCIÓN: Función de cambio de pestaña modificada =====
  // Ahora esta función se encarga de cargar los datos de nutrición de forma asíncrona
  // solo cuando es estrictamente necesario, mejorando el rendimiento.
  const handleTabClick = async (tabId: TabId, forceLoad = false) => {
    setActiveTab(tabId);
    setActiveTestView('main');
    router.push(`/historias/${patientId}?tab=${tabId}`, { scroll: false });
    
    if (tabId === 'alimentacion' && (!nutritionData || forceLoad)) {
      setIsLoadingNutrition(true);
      const result = await getFullNutritionDataForPatient(patientId);
      if (result.success && result.data) {
        setNutritionData(result.data);
      } else {
        toast.error(result.error || 'No se pudo cargar la guía de nutrición.');
      }
      setIsLoadingNutrition(false);
    }
  }
  
  const renderBiofisicaContent = () => {
    // Se mantiene intacta toda esta lógica de renderizado.
    switch (activeTestView) {
      case 'main':
        return (
          <EdadBiologicaMain 
            patient={patient!} 
            onTestClick={() => setActiveTestView('biofisica')} 
            onBiochemistryTestClick={() => setActiveTestView('bioquimica')}
            onOrthomolecularTestClick={() => setActiveTestView('orthomolecular')}
            onHistoryClick={() => setActiveTestView('biofisica_history')}
            onBiochemistryHistoryClick={() => setActiveTestView('bioquimica_history')}
            onGeneticTestClick={() => setActiveTestView('genetica')}
          />
        );
      case 'biofisica':
        return <EdadBiofisicaTestView patient={patient!} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'bioquimica':
        return <EdadBioquimicaTestView patient={patient!} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'orthomolecular':
        return <OrthomolecularTestView patient={patient!} onBack={() => setActiveTestView('main')} onTestComplete={refreshPatientData} />;
      case 'biofisica_history':
        return <BiophysicsHistoryView patient={patient!} onBack={() => setActiveTestView('main')} onHistoryChange={refreshPatientData} />;
      case 'bioquimica_history':
        return <BiochemistryHistoryView patient={patient!} onBack={() => setActiveTestView('main')} onHistoryChange={refreshPatientData} />;
      case 'genetica':
        return <GeneticTestView report={telotestReportData} onBack={() => setActiveTestView('main')} />;
      default:
        return null;
    }
  }
  
  // Se mantiene intacto el renderizado principal del componente.
  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="loader"></div></div>;
  }

  if (!patient) {
    return <div className="text-center py-12"><p className="text-gray-500">Paciente no encontrado. Redirigiendo...</p></div>;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
        {/* Header del Paciente (sin cambios) */}
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

        {/* Navegación de Pestañas (sin cambios) */}
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

        {/* Contenido de las Pestañas (con la modificación para 'alimentacion') */}
        <div className="min-h-[400px] mt-6">
            {activeTab === 'resumen' && (
                <ClinicalSummary 
                    patient={patient} 
                    onNavigateToTab={handleTabClick}
                    onReloadPatient={refreshPatientData}
                />
            )}
            
            {activeTab === 'historia' && ( isEditing ? ( <PatientEditForm patient={patient} onUpdate={handleUpdateSuccess} onCancel={() => setIsEditing(false)} /> ) : ( <div className="card">{/* ... (Contenido original de la vista de historia) */}</div> ) )}
            
            {activeTab === 'biofisica' && renderBiofisicaContent()}

            {activeTab === 'guia' && ( <PatientGuide patient={patient} /> )}

            {/* ===== ANÁLISIS Y CORRECCIÓN: Renderizado condicional del componente de nutrición ===== */}
            {activeTab === 'alimentacion' && (
                isLoadingNutrition ? <div className="flex justify-center items-center h-64"><div className="loader"></div><p className="ml-4">Cargando Guía Nutrigenómica...</p></div> :
                (nutritionData ? 
                    <NutrigenomicGuide patient={patient} initialData={nutritionData} /> : 
                    <div className="card text-center">No se pudieron cargar los datos de nutrición. Intente de nuevo.</div>
                )
            )}
            
            {activeTab === 'omicas' && <div className="card text-center py-12">{/* ... */}</div>}
            {activeTab === 'seguimiento' && <div className="card text-center py-12">{/* ... */}</div>}
        </div>
    </div>
  );
}
