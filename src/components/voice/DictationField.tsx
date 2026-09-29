'use client';

// Compone captura y propuesta sobre un campo de texto existente.
//
// Es lo unico que un formulario necesita importar: recibe el valor actual del
// campo y devuelve el nuevo valor solo cuando el medico acepta la propuesta.
// El componente padre no tiene que saber nada de MediaRecorder ni de proveedores.

import React, { useState } from 'react';
import { FaMicrophone } from 'react-icons/fa';
import {
  dictadoHabilitadoEnCliente,
  dictadoSuspendidoEnCliente,
  MOTIVO_SUSPENSION,
} from '@/lib/voice/dictation-flag';
import DictationButton from './DictationButton';
import DictationProposal from './DictationProposal';

interface DictationFieldProps {
  patientId: string;
  /** Contenido actual del campo. */
  valor: string;
  /** Se llama SOLO cuando el medico acepta la propuesta. */
  onAceptar: (nuevoValor: string) => void;
}

interface Propuesta {
  texto: string;
  /** El texto no procede del audio: lo genero el adaptador de prueba. */
  simulado: boolean;
}

export default function DictationField({ patientId, valor, onAceptar }: DictationFieldProps) {
  const [propuesta, setPropuesta] = useState<Propuesta | null>(null);

  // Con el flag apagado no se pinta nada. La Server Action lo comprueba tambien
  // por su cuenta: esto solo evita ofrecer un boton que el servidor rechazaria.
  if (!dictadoHabilitadoEnCliente()) return null;

  // Suspendido no es lo mismo que apagado: el boton se queda a la vista, sin
  // funcionar, y dice por que al pasar el cursor. Se comprueba DESPUES del flag
  // principal para que apagar el dictado del todo siga ocultandolo entero.
  if (dictadoSuspendidoEnCliente()) {
    return (
      <div className="mt-2">
        <button
          type="button"
          disabled
          title={MOTIVO_SUSPENSION}
          aria-label={MOTIVO_SUSPENSION}
          className="btn-secondary flex items-center gap-2 opacity-60 cursor-not-allowed"
        >
          <FaMicrophone /> Dictar
        </button>
        {/* El title solo aparece al pasar el cursor; en tactil no hay hover, asi
            que el motivo se deja tambien escrito debajo. */}
        <p className="mt-1 text-xs text-gray-500 max-w-prose">{MOTIVO_SUSPENSION}</p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <DictationButton
        patientId={patientId}
        onTranscripcion={(texto, simulado) => setPropuesta({ texto, simulado })}
        disabled={propuesta !== null}
      />

      {propuesta !== null && (
        <DictationProposal
          textoExistente={valor}
          textoDictado={propuesta.texto}
          simulado={propuesta.simulado}
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
