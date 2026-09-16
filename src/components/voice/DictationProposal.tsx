'use client';

// Propuesta de dictado.
//
// Esta pantalla es la razon de ser de todo el modulo. El texto transcrito NO
// entra en el campo clinico hasta que el medico pulsa Aceptar. Un agente que
// escribe directo en una historia convierte un error de transcripcion en un
// dato clinico, y de ahi pasa a la Guia impresa que el paciente se lleva.
//
// Por eso se muestra el resultado final —el campo tal como quedaria— y no solo
// el fragmento dictado: el medico decide sobre lo que va a quedar guardado.

import React, { useState } from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { combinarDictado, type ModoDictado } from '@/lib/voice/dictation-merge';

interface DictationProposalProps {
  /** Contenido actual del campo. No se modifica hasta que se acepta. */
  textoExistente: string;
  /** Transcripcion recibida del proveedor. */
  textoDictado: string;
  /**
   * El texto NO procede del audio: lo genero el adaptador de prueba porque la
   * configuracion del proveedor esta incompleta.
   */
  simulado?: boolean;
  /** Se llama con el texto final solo si el medico acepta. */
  onAceptar: (textoFinal: string) => void;
  onDescartar: () => void;
}

export default function DictationProposal({
  textoExistente,
  textoDictado,
  simulado = false,
  onAceptar,
  onDescartar,
}: DictationProposalProps) {
  // El dictado es editable: corregir aqui un nombre mal transcrito es mas rapido
  // que aceptar y luego buscarlo dentro del campo.
  const [dictadoEditado, setDictadoEditado] = useState(textoDictado);
  const [modo, setModo] = useState<ModoDictado>('anexar');

  const resultado = combinarDictado(textoExistente, dictadoEditado, modo);
  const hayTextoPrevio = textoExistente.trim() !== '';

  return (
    <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 p-3">
      <p className="mb-2 text-sm font-semibold text-amber-900">
        Propuesta de dictado — revise antes de aceptar
      </p>

      {/*
        El adaptador de prueba ya devuelve un texto que se explica a si mismo,
        y aun asi se leyo dos veces como un error del sistema. El aviso va
        aparte del contenido, en rojo y nombrando la variable que hay que
        corregir, para que el diagnostico no dependa de leer el texto.
      */}
      {simulado && (
        <div role="alert" className="mb-3 rounded border border-red-400 bg-red-50 p-2">
          <p className="text-sm font-semibold text-red-800">
            Esto NO es lo que usted dictó
          </p>
          <p className="mt-1 text-xs text-red-700">
            El dictado está en modo de prueba: no se transcribió el audio. Para
            transcripción real, <code>DICTADO_VOZ_PROVEEDOR</code> debe valer{' '}
            <code>whisper-local</code> y <code>WHISPER_URL</code> debe apuntar al
            servicio de Whisper.
          </p>
        </div>
      )}

      <label className="mb-1 block text-xs font-medium text-amber-900" htmlFor="dictado-editable">
        Texto transcrito (puede corregirlo)
      </label>
      <textarea
        id="dictado-editable"
        value={dictadoEditado}
        onChange={(e) => setDictadoEditado(e.target.value)}
        className="input w-full"
        rows={3}
      />

      {hayTextoPrevio && (
        <fieldset className="mt-2">
          <legend className="text-xs font-medium text-amber-900">
            El campo ya tiene contenido
          </legend>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-1 text-sm text-amber-900">
              <input
                type="radio"
                name="modo-dictado"
                checked={modo === 'anexar'}
                onChange={() => setModo('anexar')}
              />
              Añadir al final
            </label>
            <label className="flex items-center gap-1 text-sm text-amber-900">
              <input
                type="radio"
                name="modo-dictado"
                checked={modo === 'reemplazar'}
                onChange={() => setModo('reemplazar')}
              />
              Reemplazar todo
            </label>
          </div>
        </fieldset>
      )}

      <p className="mt-3 mb-1 text-xs font-medium text-amber-900">Así quedará el campo</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-sm text-gray-800">
        {resultado || <span className="text-gray-400">(vacío)</span>}
      </pre>

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onDescartar}
          className="btn-secondary flex items-center gap-2"
        >
          <FaTimes /> Descartar
        </button>
        <button
          type="button"
          onClick={() => onAceptar(resultado)}
          disabled={dictadoEditado.trim() === ''}
          className="btn-primary flex items-center gap-2"
        >
          <FaCheck /> Aceptar
        </button>
      </div>
    </div>
  );
}
