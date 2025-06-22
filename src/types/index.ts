export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MEDICO' | 'ADMINISTRATIVO' | 'PACIENTE';
  avatar?: string;
}

export interface Patient {
  id: string;
  userId: string;
  photo?: string;
  nationality: string;
  identification: string;
  historyDate: Date;
  lastName: string;
  firstName: string;
  birthDate: Date;
  chronologicalAge: number;
  gender: Gender;
  birthPlace: string;
  phone: string;
  maritalStatus: string;
  profession: string;
  country: string;
  state: string;
  city: string;
  address: string;
  bloodType: string;
  email: string;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
  biophysicsTests?: BiophysicsTest[];
}

export type Gender = 'MASCULINO' | 'FEMENINO' | 'MASCULINO_DEPORTIVO' | 'FEMENINO_DEPORTIVO';

export interface BiophysicsTest {
  id: string;
  patientId: string;
  chronologicalAge: number;
  biologicalAge: number;
  differentialAge: number;
  gender: string;
  isAthlete: boolean;
  testDate: Date;

  // Métricas y sus edades calculadas
  fatPercentage?: number;
  fatAge?: number;
  bmi?: number;
  bmiAge?: number;
  digitalReflexes?: number;
  reflexesAge?: number;
  visualAccommodation?: number;
  visualAge?: number;
  staticBalance?: number;
  balanceAge?: number;
  skinHydration?: number;
  hydrationAge?: number;
  systolicPressure?: number;
  systolicAge?: number;
  diastolicPressure?: number;
  diastolicAge?: number;
}

export interface Board {
  id: string;
  rangeId: number;
  type: string;
  name: string;
  minValue: number;
  maxValue: number;
  inverse: boolean;
  range?: Range;
}

export interface Range {
  id: number;
  minAge: number;
  maxAge: number;
}
