import { z } from 'zod';

export const patientSchema = z.object({
  photo: z.string().optional(),
  nationality: z.string().min(1, 'La nacionalidad es requerida'),
  identification: z.string().min(1, 'La identificación es requerida'),
  historyDate: z.string().min(1, 'La fecha de historia es requerida'),
  lastName: z.string().min(1, 'Los apellidos son requeridos'),
  firstName: z.string().min(1, 'Los nombres son requeridos'),
  birthDate: z.string().min(1, 'La fecha de nacimiento es requerida'),
  gender: z.enum(['MASCULINO', 'FEMENINO', 'MASCULINO_DEPORTIVO', 'FEMENINO_DEPORTIVO']),
  birthPlace: z.string().min(1, 'El lugar de nacimiento es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  maritalStatus: z.string().min(1, 'El estado civil es requerido'),
  profession: z.string().min(1, 'La profesión es requerida'),
  country: z.string().min(1, 'El país es requerido'),
  state: z.string().min(1, 'El estado es requerido'),
  city: z.string().min(1, 'La ciudad es requerida'),
  address: z.string().min(1, 'La dirección es requerida'),
  bloodType: z.string().min(1, 'El grupo sanguíneo es requerido'),
  email: z.string().email('Email inválido'),
  observations: z.string().optional(),
});

export const biophysicsTestSchema = z.object({
  fatPercentage: z.number().min(0).max(100).optional(),
  bmi: z.number().min(10).max(60).optional(),
  digitalReflexes: z.object({
    high: z.number().min(0),
    long: z.number().min(0),
    width: z.number().min(0),
  }).optional(),
  visualAccommodation: z.number().min(0).max(120).optional(),
  staticBalance: z.object({
    high: z.number().min(0),
    long: z.number().min(0),
    width: z.number().min(0),
  }).optional(),
  skinHydration: z.number().min(0).max(120).optional(),
  systolicPressure: z.number().min(60).max(250).optional(),
  diastolicPressure: z.number().min(40).max(150).optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;
export type BiophysicsTestFormData = z.infer<typeof biophysicsTestSchema>;
