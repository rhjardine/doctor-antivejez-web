// src/components/patient-guide/PatientGuidePreview.tsx
'use client';

import React, { useRef } from 'react';
import { PatientWithDetails } from '@/types';
import { GuideCategory, GuideFormValues } from '@/types/guide';
import { FaPrint, FaTimes } from 'react-icons/fa';
import { createPortal } from 'react-dom';
import PrintableGuideContent from './PrintableGuideContent'; // <-- Se importa el contenido

interface Props {
  patient: PatientWithDetails;
  guideData: GuideCategory[];
  formValues: GuideFormValues;
  onClose: () => void;
}

const PatientGuidePreview = ({ patient, guideData, formValues, onClose }: Props) => {
  const printableContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    document.body.classList.add('printing');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing');
    }, 100);
  };

  return (
    <>
      {/* Modal de Vista Previa (no se imprime) */}
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn no-print">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Vista Previa de la Guía</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrint}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
              >
                <FaPrint /> Imprimir / Guardar PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Contenido de la Vista Previa en pantalla */}
          <div className="overflow-y-auto">
            <PrintableGuideContent
              ref={printableContentRef}
              patient={patient}
              guideData={guideData}
              formValues={formValues}
            />
          </div>
        </div>
      </div>

      {/* Contenido Imprimible (oculto en pantalla, visible solo al imprimir) */}
      {typeof window !== 'undefined' && createPortal(
        <div id="printable-content-wrapper">
          <PrintableGuideContent
            patient={patient}
            guideData={guideData}
            formValues={formValues}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default PatientGuidePreview;