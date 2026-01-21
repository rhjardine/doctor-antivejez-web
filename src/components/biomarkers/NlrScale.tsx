'use client';

import { NlrRiskLevel } from '@prisma/client';

const ranges = [
  { label: '0.1 - 0.7', risk: 'OPTIMAL', color: 'bg-cyan-500' },
  { label: '1 - 2', risk: 'LOW_INFLAMMATION', color: 'bg-green-500' },
  { label: '2 - 3', risk: 'BORDERLINE', color: 'bg-gray-500' },
  { label: '3 - 7', risk: 'MODERATE_INFLAMMATION', color: 'bg-yellow-500' },
  { label: '7 - 11', risk: 'HIGH_INFLAMMATION', color: 'bg-yellow-600' },
  { label: '11 - 17', risk: 'SEVERE_INFLAMMATION', color: 'bg-red-500' },
  { label: '17 - 23', risk: 'CRITICAL_INFLAMMATION', color: 'bg-red-700' },
  { label: '23+', risk: 'EXTREME_RISK', color: 'bg-black' },
];

interface NlrScaleProps {
  nlrValue: number;
  riskLevel: NlrRiskLevel;
}

export default function NlrScale({ nlrValue, riskLevel }: NlrScaleProps) {
  return (
    <div className="w-full">
      <div className="flex w-full rounded-md overflow-hidden shadow-md">
        {ranges.map((range, index) => (
          <div
            key={index}
            className={`flex-1 p-2 text-center text-white font-bold text-sm transition-all duration-300 ${range.color} ${
              range.risk === riskLevel ? 'scale-110 transform ring-4 ring-purple-500 z-10' : 'opacity-75'
            }`}
          >
            {range.label}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">Tu resultado:</p>
        <p className="text-4xl font-bold text-primary">{nlrValue.toFixed(2)}</p>
        <p className="font-semibold text-gray-800">{riskLevel.replace(/_/g, ' ')}</p>
      </div>
    </div>
  );
}