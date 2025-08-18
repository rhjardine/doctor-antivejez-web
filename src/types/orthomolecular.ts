// src/types/orthomolecular.ts

export const ORTHOMOLECULAR_ITEMS = [
  { key: 'aluminio', label: 'Aluminio', unit: '' },
  { key: 'antimonio', label: 'Antimonio', unit: '' },
  { key: 'arsenico', label: 'Arsénico', unit: '' },
  { key: 'bario', label: 'Bario', unit: '' },
  { key: 'berilio', label: 'Berilio', unit: '' },
  { key: 'bismuto', label: 'Bismuto', unit: '' },
  { key: 'cadmio', label: 'Cadmio', unit: '' },
  { key: 'mercurio', label: 'Mercurio', unit: '' },
  { key: 'niquel', label: 'Níquel', unit: '' },
  { key: 'plata', label: 'Plata', unit: '' },
  { key: 'platino', label: 'Platino', unit: '' },
  { key: 'plomo', label: 'Plomo', unit: '' },
  { key: 'talio', label: 'Talio', unit: '' },
  { key: 'tinio', label: 'Tinio', unit: '' },
  { key: 'titanio', label: 'Titanio', unit: '' },
  { key: 'torio', label: 'Torio', unit: '' },
  { key: 'uranio', label: 'Uranio', unit: '' },
  { key: 'calcio', label: 'Calcio', unit: '' },
  { key: 'calcio_alt', label: 'Calcio (Alt)', unit: '' },
  { key: 'magnesio', label: 'Magnesio', unit: '' },
  { key: 'magnesio_alt', label: 'Magnesio (Alt)', unit: '' },
  { key: 'sodio', label: 'Sodio', unit: '' },
  { key: 'potasio', label: 'Potasio', unit: '' },
  { key: 'potasio_alt', label: 'Potasio (Alt)', unit: '' },
  { key: 'cobre', label: 'Cobre', unit: '' },
  { key: 'cobre_alt', label: 'Cobre (Alt)', unit: '' },
  { key: 'zinc', label: 'Zinc', unit: '' },
  { key: 'zinc_alt', label: 'Zinc (Alt)', unit: '' },
  { key: 'manganeso', label: 'Manganeso', unit: '' },
  { key: 'manganeso_alt', label: 'Manganeso (Alt)', unit: '' },
  { key: 'cromo', label: 'Cromo', unit: '' },
  { key: 'cromo_alt', label: 'Cromo (Alt)', unit: '' },
  { key: 'vanadio', label: 'Vanadio', unit: '' },
  { key: 'molibdeno', label: 'Molibdeno', unit: '' },
  { key: 'boro', label: 'Boro', unit: '' },
  { key: 'yodo', label: 'Yodo', unit: '' },
  { key: 'litio', label: 'Litio', unit: '' },
  { key: 'phosphoro', label: 'Fósforo', unit: '' },
  { key: 'selenio', label: 'Selenio', unit: '' },
  { key: 'estroncio', label: 'Estroncio', unit: '' },
  { key: 'azufre', label: 'Azufre', unit: '' },
  { key: 'cobalto', label: 'Cobalto', unit: '' },
  { key: 'hierro', label: 'Hierro', unit: '' },
  { key: 'germanio', label: 'Germanio', unit: '' },
  { key: 'rubidio', label: 'Rubidio', unit: '' },
  { key: 'zirconio', label: 'Zirconio', unit: '' },
] as const;

export type OrthomolecularItem = typeof ORTHOMOLECULAR_ITEMS[number];
type OrthomolecularItemKey = typeof ORTHOMOLECULAR_ITEMS[number]['key'];

export type OrthomolecularFormValues = {
  [K in OrthomolecularItemKey]?: number;
};

export type OrthomolecularPartialAges = {
  [K in `${OrthomolecularItemKey}Age`]?: number;
};

export type ResultStatus = 'REJUVENECIDO' | 'NORMAL' | 'ENVEJECIDO' | 'SIN CALCULAR';

export interface OrthomolecularCalculationResult {
  biologicalAge: number;
  differentialAge: number;
  chronologicalAge: number;
  partialAges: OrthomolecularPartialAges;
  status: ResultStatus;
}