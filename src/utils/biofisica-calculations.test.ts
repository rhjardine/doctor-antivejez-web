import { describe, expect, it } from 'vitest';

import type { FormValues } from '@/types/biophysics';
import {
  calculateBiofisicaResults,
  getAgeStatus,
  getStatusColor,
} from '@/utils/biofisica-calculations';

const baseFormValues: FormValues = {
  fatPercentage: 10,
  bmi: 18,
  digitalReflexes: { high: 50, long: 50, width: 50 },
  visualAccommodation: 0,
  staticBalance: { high: 120, long: 120, width: 120 },
  skinHydration: 0,
  systolicPressure: 100,
  diastolicPressure: 60,
};

describe('calculateBiofisicaResults', () => {
  it('calcula una edad biológica consistente para valores base masculinos', () => {
    const result = calculateBiofisicaResults([], baseFormValues, 40, 'MASCULINO', false);

    expect(result.biologicalAge).toBe(21);
    expect(result.differentialAge).toBe(-19);
    expect(result.partialAges).toEqual({
      fatAge: 21,
      bmiAge: 21,
      reflexesAge: 21,
      visualAge: 21,
      balanceAge: 21,
      hydrationAge: 21,
      systolicAge: 21,
      diastolicAge: 21,
    });
  });

  it('usa el baremo deportivo femenino sin tocar la firma pública', () => {
    const result = calculateBiofisicaResults(
      [],
      { ...baseFormValues, fatPercentage: 1 },
      35,
      'FEMENINO',
      true,
    );

    expect(result.partialAges.fatAge).toBe(21);
    expect(result.biologicalAge).toBe(21);
    expect(result.differentialAge).toBe(-14);
  });

  it('respeta la lógica de doble umbral y valores extremos en el IMC', () => {
    const lowRangeResult = calculateBiofisicaResults(
      [],
      { ...baseFormValues, bmi: 16 },
      50,
      'MASCULINO',
      false,
    );

    const extremeResult = calculateBiofisicaResults(
      [],
      { ...baseFormValues, bmi: 9 },
      50,
      'MASCULINO',
      false,
    );

    expect(lowRangeResult.partialAges.bmiAge).toBe(70);
    expect(extremeResult.partialAges.bmiAge).toBe(120);
  });
});

describe('biofisica status helpers', () => {
  it('clasifica correctamente el estado de edad diferencial', () => {
    expect(getAgeStatus(-2)).toBe('REJUVENECIDO');
    expect(getAgeStatus(0)).toBe('NORMAL');
    expect(getAgeStatus(3)).toBe('ENVEJECIDO');
  });

  it('devuelve la clase visual esperada para cada estado', () => {
    expect(getStatusColor('REJUVENECIDO')).toBe('text-status-green');
    expect(getStatusColor('NORMAL')).toBe('text-status-yellow');
    expect(getStatusColor('ENVEJECIDO')).toBe('text-status-red');
  });
});