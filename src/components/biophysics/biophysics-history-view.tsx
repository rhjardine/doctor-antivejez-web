'use client';

import { useState } from 'react';
import { PatientWithDetails, BiophysicsTest } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { FaArrowLeft, FaChartLine, FaInfoCircle, FaRuler, FaWeight, FaBrain, FaEye, FaBalanceScale, FaTint, FaHeartbeat } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BiophysicsHistoryViewProps {
  patient: PatientWithDetails;
  onBack: () => void;
}

// Mapeo de claves a etiquetas e iconos para la vista de detalles
const detailItemsMap = [
  { key: 'fatPercentage', label: '% Grasa', icon: FaWeight },
  { key: 'bmi', label: 'IMC', icon: FaRuler },
  { key: 'digitalReflexes', label: 'Reflejos Digitales', icon: FaBrain },
  { key: 'visualAccommodation', label: 'Acomodación Visual', icon: FaEye },
  { key: 'staticBalance', label: 'Balance Estático', icon: FaBalanceScale },
  { key: 'skinHydration', label: 'Hidratación Cutánea', icon: FaTint },
  { key: 'systolicPressure', label: 'T.A. Sistólica', icon: FaHeartbeat },
  { key: 'diastolicPressure', label: 'T.A. Diastólica', icon: FaHeartbeat },
];

export default function BiophysicsHistoryView({ patient, onBack }: BiophysicsHistoryViewProps) {
  const [selectedTest, setSelectedTest] = useState<BiophysicsTest | null>(patient.biophysicsTests?.[0] || null);

  const chartData = patient.biophysicsTests
    .map(test => ({
      date: formatDate(test.testDate),
      'Edad Biológica': test.biologicalAge,
      'Edad Cronológica': test.chronologicalAge,
    }))
    .reverse(); // Revertir para que el gráfico muestre de más antiguo a más reciente

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header de la sección */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            title="Volver a Edad Biológica"
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Historial de Tests Biofísicos</h2>
            <p className="text-gray-600">
              Evolución de {patient.firstName} {patient.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolución */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FaChartLine className="mr-2 text-primary" />
          Evolución de Edad Biológica vs. Cronológica
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" label={{ value: 'Años', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Edad Biológica" stroke="rgb(35, 188, 239)" strokeWidth={2} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Edad Cronológica" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Línea de tiempo y detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de la línea de tiempo */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Línea de Tiempo</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar-tabs">
            {patient.biophysicsTests.map(test => (
              <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border-l-4 ${
                  selectedTest?.id === test.id
                    ? 'bg-primary/10 border-primary shadow-md'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <p className="font-semibold text-gray-800">{formatDate(test.testDate)}</p>
                <p className="text-sm text-gray-600">
                  Edad Bio: <span className="font-bold text-primary">{Math.round(test.biologicalAge)}</span> vs Crono: {Math.round(test.chronologicalAge)}
                </p>
                <p className={`text-sm font-medium ${test.differentialAge < 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Diferencial: {test.differentialAge > 0 ? '+' : ''}{Math.round(test.differentialAge)} años
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Columna de detalles del test seleccionado */}
        <div className="lg:col-span-2">
          {selectedTest ? (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FaInfoCircle className="mr-2 text-primary" />
                Detalles del Test - {formatDateTime(selectedTest.testDate)}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {detailItemsMap.map(({ key, label, icon: Icon }) => {
                  const value = selectedTest[key as keyof BiophysicsTest];
                  const ageKey = `${key.replace('Percentage', '').replace('Pressure', '')}Age` as keyof BiophysicsTest;
                  const ageValue = selectedTest[ageKey];

                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                      <Icon className="mx-auto text-2xl text-primary/70 mb-2" />
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-lg font-bold text-gray-900">{value !== null ? Number(value).toFixed(2) : '--'}</p>
                      <p className="text-xs text-gray-500">Edad: {ageValue !== null ? Number(ageValue).toFixed(1) : '--'}a</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full card">
              <p className="text-gray-500">Selecciona un test de la línea de tiempo para ver los detalles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
