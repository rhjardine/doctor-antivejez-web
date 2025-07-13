import { PatientWithDetails } from '@/types';
import { FaHeartbeat, FaFlask, FaDna, FaAtom } from 'react-icons/fa';

// Definición de las propiedades que espera el componente.
interface EdadBiologicaMainProps {
  patient: PatientWithDetails;
  onTestClick: () => void;
  // ===== INICIO DE LA MODIFICACIÓN: Añadir prop para el nuevo test =====
  onBiochemistryTestClick: () => void;
  // ===== FIN DE LA MODIFICACIÓN =====
}

export default function EdadBiologicaMain({ patient, onTestClick, onBiochemistryTestClick }: EdadBiologicaMainProps) {
  const lastBiophysicsTest = patient.biophysicsTests?.[0];

  const testCards = [
    {
      id: 'biofisica',
      title: 'EDAD BIOFÍSICA',
      icon: FaHeartbeat,
      value: lastBiophysicsTest?.biologicalAge ? Math.round(lastBiophysicsTest.biologicalAge) : '--',
      // ===== INICIO DE LA MODIFICACIÓN: Hacer la card clickeable =====
      isClickable: true,
      onClick: onTestClick,
      color: 'bg-primary',
      // ===== FIN DE LA MODIFICACIÓN =====
    },
    {
      id: 'bioquimica',
      title: 'EDAD BIOQUÍMICA',
      icon: FaFlask,
      value: '--',
      // ===== INICIO DE LA MODIFICACIÓN: Hacer la card clickeable y cambiar color =====
      isClickable: true,
      onClick: onBiochemistryTestClick,
      color: 'bg-green-600', // Un color diferente para distinguirlo
      // ===== FIN DE LA MODIFICACIÓN =====
    },
    {
      id: 'orthomolecular',
      title: 'EDAD ORTHOMOLECULAR',
      icon: FaAtom,
      value: '--',
      isClickable: false,
      onClick: undefined,
      color: 'bg-gray-400',
    },
    {
      id: 'genetica',
      title: 'EDAD GENÉTICA',
      icon: FaDna,
      value: '--',
      isClickable: false,
      onClick: undefined,
      color: 'bg-gray-400',
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
              <div
                key={card.id}
                onClick={card.onClick}
                className={`${card.color} rounded-xl p-6 text-white transition-all ${
                  card.isClickable
                    ? 'cursor-pointer hover:shadow-lg hover:scale-105'
                    : 'cursor-not-allowed opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="text-4xl opacity-80" />
                  {!card.isClickable && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">En desarrollo</span>
                  )}
                </div>

                <h3 className="text-sm font-medium mb-2 opacity-90">{card.title}</h3>

                <p className="text-3xl font-bold">
                  {card.value !== '--' ? `${card.value} años` : card.value}
                </p>

                {card.id === 'biofisica' && lastBiophysicsTest && (
                  <p className="text-sm mt-2 opacity-80">
                    Diferencia: {lastBiophysicsTest.differentialAge > 0 ? '+' : ''}{Math.round(lastBiophysicsTest.differentialAge)} años
                  </p>
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
                    style={{
                      width: `${Math.min(100, Math.max(0, 50 + (difference * 2)))}%`
                    }}
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
