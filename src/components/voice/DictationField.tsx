'use client';

// Compone captura y propuesta sobre un campo de texto existente.
//
// Es lo unico que un formulario necesita importar: recibe el valor actual del
// campo y devuelve el nuevo valor solo cuando el medico acepta la propuesta.
// El componente padre no tiene que saber nada de MediaRecorder ni de proveedores.

import React, { useState } from 'react';
import { dictadoHabilitadoEnCliente } from '@/lib/voice/dictation-flag';
import DictationButton from './DictationButton';
import DictationProposal from './DictationProposal';

interface DictationFieldProps {
  patientId: string;
  /** Contenido actual del campo. */
  valor: string;
  /** Se llama SOLO cuando el medico acepta la propuesta. */
  onAceptar: (nuevoValor: string) => void;
}

export default function DictationField({ patientId, valor, onAceptar }: DictationFieldProps) {
  const [propuesta, setPropuesta] = useState<string | null>(null);

  // Con el flag apagado no se pinta nada. La Server Action lo comprueba tambien
  // por su cuenta: esto solo evita ofrecer un boton que el servidor rechazaria.
  if (!dictadoHabilitadoEnCliente()) return null;

  return (
    <div className="mt-2">
      <DictationButton
        patientId={patientId}
        onTranscripcion={setPropuesta}
        disabled={propuesta !== null}
      />

      {propuesta !== null && (
        <DictationProposal
          textoExistente={valor}
          textoDictado={propuesta}
          onAceptar={(textoFinal) => {
            onAceptar(textoFinal);
            setPropuesta(null);
          }}
          onDescartar={() => setPropuesta(null)}
        />
      )}
    </div>
  );
}
