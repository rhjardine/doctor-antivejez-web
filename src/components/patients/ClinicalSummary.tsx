'use client';

import { PatientWithDetails, TabId } from '@/types'; // ===== MODIFICADO =====
import {
  FaCalendarCheck,
  FaPills,
  FaHistory,
  FaChartLine,
  FaEdit,
  FaPlus,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '@/utils/date';

// --- TIPOS Y DATOS DE EJEMPLO (MOCK DATA) ---
type Appointment = {
  date: string;
  time: string;
  reason: string;
  lastVisit?: string;
};

type Medication = {
  id: number;
  name: string;
  dosage: string;
};

type HistoryEvent = {
  id: number;
  date: string;
  title: string;
  description: string;
};

const mockAppointment: Appointment = {
  date: '15/08/2024',
  time: '10:00 AM',
  reason: 'Revisión trimestral',
  lastVisit: '15/05/2024',
};

const mockMedications: Medication[] = [
  { id: 1, name: 'Magnesio', dosage: '500mg, 1 vez al día' },
  { id: 2, name: 'Omega-3', dosage: '1000mg, 2 veces al día' },
  { id: 3, name: 'Vitamina D', dosage: '2000 UI, 1 vez al día' },
];

const mockHistory: HistoryEvent[] = [
  {
    id: 1,
    date: '15/05/2024',
    title: 'Evolución Mensual',
    description: 'Paciente presenta mejora en marcadores metabólicos. Se ajusta tratamiento para optimizar resultados.',
  },
  {
    id: 2,
    date: '15/02/2024',
    title: 'Análisis completo',
    description: 'Se solicitan nuevos análisis de sangre y perfil lipídico.',
  },
];

// --- SUB-COMPONENTES DEL RESUMEN ---

const BiologicalAgeCard = ({ patient }: { patient: PatientWithDetails }) => {
  const latestTest = patient.biophysicsTests?.[0];
  const chartData = patient.biophysicsTests
    .map(test => ({
      date: formatDate(test.testDate),
      'Edad Biológica': test.biologicalAge,
      'Edad Cronológica': test.chronologicalAge,
    }))
    .reverse();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-4 uppercase tracking-tight">Edad Biológica</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edad Cronológica</p>
          <p className="text-3xl font-black text-slate-900">{patient.chronologicalAge} años</p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edad Biológica</p>
          <p className="text-3xl font-black text-primary">
            {latestTest ? `${Math.round(latestTest.biologicalAge)} años` : '--'}
          </p>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diferencia</p>
          <p className={`text-3xl font-black ${latestTest && latestTest.differentialAge < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {latestTest ? `${latestTest.differentialAge > 0 ? '+' : ''}${Math.round(latestTest.differentialAge)} años` : '--'}
          </p>
        </div>
      </div>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Edad Biológica" stroke="#23bcef" strokeWidth={2} />
            <Line type="monotone" dataKey="Edad Cronológica" stroke="#343a40" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const BiomarkersCard = ({ onNavigate }: { onNavigate: (tab: TabId) => void }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">Biomarcadores Principales</h3>
      <button onClick={() => onNavigate('biofisica')} className="text-xs font-bold text-primary hover:underline uppercase">Ver todos</button>
    </div>
    <div className="h-60 flex items-center justify-center bg-gray-50 rounded-lg">
      <p className="text-gray-500">Gráfico de biomarcadores próximamente.</p>
    </div>
  </div>
);


const NextAppointmentCard = ({ appointment }: { appointment: Appointment }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-tight">
      <FaCalendarCheck className="text-primary" /> Próxima Cita
    </h3>
    <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
      <p className="font-bold text-slate-900 text-xl">{appointment.date}</p>
      <p className="text-sm text-slate-600 font-medium">{appointment.time} - {appointment.reason}</p>
    </div>
    <div className="flex justify-between items-center mt-4 text-sm">
      <span className="text-gray-500">Última visita: {appointment.lastVisit}</span>
      <button className="font-medium text-primary hover:underline">Reprogramar</button>
    </div>
  </div>
);

const CurrentTreatmentCard = ({ medications, onNavigate }: { medications: Medication[], onNavigate: (tab: TabId) => void }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
        <FaPills className="text-primary" /> Tratamiento Actual
      </h3>
      <button onClick={() => onNavigate('guia')} className="text-xs font-bold text-primary hover:underline uppercase">Ver todos</button>
    </div>
    <div className="space-y-3">
      {medications.map(med => (
        <div key={med.id} className="flex justify-between items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <div>
            <p className="font-bold text-slate-800">{med.name}</p>
            <p className="text-sm text-slate-500 font-medium">{med.dosage}</p>
          </div>
          <button className="text-slate-400 hover:text-primary transition-colors"><FaEdit /></button>
        </div>
      ))}
    </div>
    <button className="w-full mt-4 text-sm text-primary border-2 border-dashed border-gray-300 rounded-lg py-2 hover:bg-primary/10 hover:border-primary transition-colors flex items-center justify-center gap-2">
      <FaPlus /> Añadir medicación
    </button>
  </div>
);

const RecentHistoryCard = ({ history, onNavigate }: { history: HistoryEvent[], onNavigate: (tab: TabId) => void }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 uppercase tracking-tight">
        <FaHistory className="text-primary" /> Historial Reciente
      </h3>
      <button onClick={() => onNavigate('historia')} className="text-xs font-bold text-primary hover:underline uppercase">Ver todos</button>
    </div>
    <div className="space-y-4">
      {history.map(event => (
        <div key={event.id} className="border-l-4 border-primary/30 pl-4 py-1">
          <p className="font-bold text-slate-800">{event.title}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{event.date}</p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">{event.description}</p>
        </div>
      ))}
    </div>
  </div>
);


// --- COMPONENTE PRINCIPAL DEL RESUMEN ---
// ===== INICIO DE LA MODIFICACIÓN =====
// Se añaden las props onNavigateToTab y onReloadPatient para manejar la interacción.
interface ClinicalSummaryProps {
  patient: PatientWithDetails;
  onNavigateToTab: (tabId: TabId) => void;
  onReloadPatient: () => void;
}
// ===== FIN DE LA MODIFICACIÓN =====

export default function ClinicalSummary({ patient, onNavigateToTab }: ClinicalSummaryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Columna Izquierda */}
      <div className="lg:col-span-2 space-y-6">
        <BiologicalAgeCard patient={patient} />
        <BiomarkersCard onNavigate={onNavigateToTab} />
      </div>

      {/* Columna Derecha */}
      <div className="lg:col-span-1 space-y-6">
        <NextAppointmentCard appointment={mockAppointment} />
        <CurrentTreatmentCard medications={mockMedications} onNavigate={onNavigateToTab} />
        <RecentHistoryCard history={mockHistory} onNavigate={onNavigateToTab} />
      </div>
    </div>
  );
}
