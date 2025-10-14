'use client';

import { PatientWithDetails } from '@/types';
import { FaHeartbeat, FaFlask, FaDna, FaAtom, FaHistory } from 'react-icons/fa';

interface EdadBiologicaMainProps {
  patient: PatientWithDetails;
  onTestClick: () => void;
  onBiochemistryTestClick: () => void;
  onOrthomolecularTestClick: () => void;
  onHistoryClick: () => void;
  onBiochemistryHistoryClick: () => void;
  onGeneticTestClick: () => void;
}

export default function EdadBiologicaMain({
  patient,
  onTestClick,
  onBiochemistryTestClick,
  onOrthomolecularTestClick,
  onHistoryClick,
  onBiochemistryHistoryClick,
  onGeneticTestClick,
}: EdadBiologicaMainProps) {
  const lastBiophysicsTest = patient.biophysicsTests?.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];
  const lastBiochemistryTest = patient.biochemistryTests?.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];
  const lastOrthomolecularTest = patient.orthomolecularTests?.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())[0];

  const biophysicsDifference = lastBiophysicsTest?.biologicalAge ? Math.round(lastBiophysicsTest.biologicalAge - patient.chronologicalAge) : undefined;
  const biochemistryDifference = lastBiochemistryTest?.biochemicalAge ? Math.round(lastBiochemistryTest.biochemicalAge - patient.chronologicalAge) : undefined;
  const orthomolecularDifference = lastOrthomolecularTest?.orthomolecularAge ? Math.round(lastOrthomolecularTest.orthomolecularAge - patient.chronologicalAge) : undefined;

  const testCards = [
    {
      id: 'biofisica',
      title: 'EDAD BIOFÍSICA',
      icon: FaHeartbeat,
      value: lastBiophysicsTest?.biologicalAge ? Math.round(lastBiophysicsTest.biologicalAge) : '--',
      difference: biophysicsDifference,
      isClickable: true,
      onClick: onTestClick,
      color: 'bg-primary',
      hasHistory: patient.biophysicsTests && patient.biophysicsTests.length > 0,
      onHistoryClick: onHistoryClick,
    },
    {
      id: 'bioquimica',
      title: 'EDAD BIOQUÍMICA',
      icon: FaFlask,
      value: lastBiochemistryTest?.biochemicalAge ? Math.round(lastBiochemistryTest.biochemicalAge) : '--',
      difference: biochemistryDifference,
      isClickable: true,
      onClick: onBiochemistryTestClick,
      color: 'bg-primary',
      hasHistory: patient.biochemistryTests && patient.biochemistryTests.length > 0,
      onHistoryClick: onBiochemistryHistoryClick,
    },
    {
      id: 'orthomolecular',
      title: 'EDAD ORTHOMOLECULAR',
      icon: FaAtom,
      value: lastOrthomolecularTest?.orthomolecularAge ? Math.round(lastOrthomolecularTest.orthomolecularAge) : '--',
      difference: orthomolecularDifference,
      isClickable: true,
      onClick: onOrthomolecularTestClick,
      color: 'bg-primary',
      hasHistory: false,
      onHistoryClick: undefined,
    },
    {
      id: 'genetica',
      title: 'EDAD GENÉTICA',
      icon: FaDna,
      value: 'Ver', 
      difference: undefined,
      isClickable: true,
      onClick: onGeneticTestClick,
      color: 'bg-primary', 
      hasHistory: false, 
      onHistoryClick: undefined,
    },
  ];

  const getGaugeColor = (diff: number): string => {
    if (diff <= -7) return 'text-status-green';
    if (diff >= -2 && diff <= 3) return 'text-status-yellow';
    return 'text-status-red';
  };
  
  const profileData = [
    {
      title: 'Perfil Cardiovascular',
      chronoAge: patient.chronologicalAge,
      testAge: lastBiophysicsTest ? Math.round(lastBiophysicsTest.systolicAge || patient.chronologicalAge) : patient.chronologicalAge,
    },
    {
      title: 'Perfil Metabólico',
      chronoAge: patient.chronologicalAge,
      testAge: lastBiophysicsTest ? Math.round(lastBiophysicsTest.bmiAge || patient.chronologicalAge) : patient.chronologicalAge,
    },
    {
      title: 'Perfil Neuromuscular',
      chronoAge: patient.chronologicalAge,
      testAge: lastBiophysicsTest ? Math.round(lastBiophysicsTest.reflexesAge || patient.chronologicalAge) : patient.chronologicalAge,
    },
    {
      title: 'Perfil Sensorial',
      chronoAge: patient.chronologicalAge,
      testAge: lastBiophysicsTest ? Math.round(lastBiophysicsTest.visualAge || patient.chronologicalAge) : patient.chronologicalAge,
    },
    {
      title: 'Perfil Dérmico',
      chronoAge: patient.chronologicalAge,
      testAge: lastBiophysicsTest ? Math.round(lastBiophysicsTest.hydrationAge || patient.chronologicalAge) : patient.chronologicalAge,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edad Cronológica Vs Edad Biológica</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className={`${card.color} rounded-xl p-6 text-white flex flex-col justify-between transition-all duration-300 ${card.isClickable ? 'hover:shadow-lg hover:-translate-y-1' : ''}`}>
                <div onClick={card.isClickable ? card.onClick : undefined} className={card.isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}>
                  <div className="flex items-center justify-between mb-4">
                    <Icon className="text-4xl opacity-80" />
                    {!card.isClickable && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">En desarrollo</span>
                    )}
                  </div>
                  <h3 className="text-sm font-medium mb-2 opacity-90">{card.title}</h3>
                  <p className="text-3xl font-bold">
                    {card.value !== '--' && card.value !== 'Ver' ? `${card.value} años` : card.value}
                  </p>
                  {card.difference !== undefined && card.difference !== null && (
                    <p className="text-sm mt-2 opacity-80">
                      Diferencia: {card.difference > 0 ? '+' : ''}{card.difference} años
                    </p>
                  )}
                </div>
                {card.hasHistory && card.onHistoryClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      card.onHistoryClick!();
                    }}
                    className="mt-4 w-full text-center py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <FaHistory />
                    Ver Historial
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Perfil Multidimensional de Envejecimiento</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profileData.map((profile, index) => {
            const difference = profile.testAge - profile.chronoAge;
            const colorClass = getGaugeColor(difference);
            return (
              <div key={index} className="card">
                <h3 className="font-medium text-gray-700 mb-4">{profile.title}</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Edad Cronológica</span>
                  <span className="font-medium">{profile.chronoAge} años</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">Edad del Perfil</span>
                  <span className={`font-medium ${colorClass}`}>{profile.testAge} años</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                      difference <= -7 ? 'bg-status-green' :
                      difference >= -2 && difference <= 3 ? 'bg-status-yellow' :
                      'bg-status-red'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, 50 + (difference * 2)))}%` }}
                  />
                </div>
                <p className={`text-xs mt-2 text-center ${colorClass}`}>
                  {difference > 0 ? '+' : ''}{difference} años
                </p>
              </div>
            );
          })}
        </div>
      </div>
      {!lastBiophysicsTest && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-blue-700">
            No se han realizado tests biofísicos aún. Haz clic en la tarjeta "EDAD BIOFÍSICA" para comenzar.
          </p>
        </div>
      )}
    </div>
  );
}