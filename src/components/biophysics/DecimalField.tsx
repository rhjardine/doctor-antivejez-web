'use client';

/**
 * DecimalField — Campo numérico clínico tolerante a la coma decimal.
 *
 * Sustituye a <input type="number">, cuyo saneamiento de valor devolvía cadena
 * vacía ante una coma decimal y hacía que el campo se borrara solo.
 *
 * Conserva en estado local el texto EXACTO que escribe el médico, de modo que
 * pueda teclear «21,» sin que el campo se vacíe, y reporta hacia arriba el
 * número ya parseado (o `undefined` mientras el texto aún no sea numérico).
 * El contrato con el formulario no cambia: sigue emitiendo `number | undefined`.
 */

import React, { useEffect, useState } from 'react';
import { formatDecimalInput, parseDecimalInput } from '@/utils/decimal-input';

interface DecimalFieldProps {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export default function DecimalField({
  value,
  onValueChange,
  placeholder,
  className,
  disabled,
  'aria-label': ariaLabel,
}: DecimalFieldProps) {
  const [raw, setRaw] = useState<string>(() => formatDecimalInput(value));

  // Resincroniza solo cuando el valor del padre deja de corresponder con lo
  // tecleado (carga de un test, botón Editar, reinicio del formulario). Sin
  // esta comprobación, escribir «21,» se revertiría a «21» en cada pulsación.
  useEffect(() => {
    setRaw((actual) => (parseDecimalInput(actual) === value ? actual : formatDecimalInput(value)));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={raw}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        setRaw(e.target.value);
        onValueChange(parseDecimalInput(e.target.value));
      }}
    />
  );
}
